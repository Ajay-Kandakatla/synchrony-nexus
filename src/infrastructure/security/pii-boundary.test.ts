import { describe, it, expect } from 'vitest';
import { PIIContainer, maskCardNumber, maskEmail, maskPhone, maskSSN } from './pii-boundary';

describe('PIIContainer', () => {
  it('should return masked value by default', () => {
    const pii = new PIIContainer('4111111111111234', 'card_number', '****1234');
    expect(pii.masked).toBe('****1234');
  });

  it('should reveal the actual value with audit', () => {
    const pii = new PIIContainer('4111111111111234', 'card_number', '****1234');
    const revealed = pii.reveal('test-context');
    expect(revealed).toBe('4111111111111234');
    expect(pii.auditTrail).toHaveLength(1);
    expect(pii.auditTrail[0]!.context).toBe('test-context');
    expect(pii.auditTrail[0]!.action).toBe('display');
  });

  it('should return masked value when converted to string', () => {
    const pii = new PIIContainer('secret', 'full_name', '***');
    expect(`${pii}`).toBe('***');
    expect(String(pii)).toBe('***');
  });

  it('should return masked value when serialized to JSON', () => {
    const pii = new PIIContainer('secret@email.com', 'email', 's***@email.com');
    expect(JSON.stringify({ email: pii })).toBe('{"email":"s***@email.com"}');
  });

  it('should track multiple accesses', () => {
    const pii = new PIIContainer('data', 'full_name', '***');
    pii.reveal('context-1');
    pii.reveal('context-2');
    pii.reveal('context-3');
    expect(pii.auditTrail).toHaveLength(3);
  });
});

describe('Masking functions', () => {
  it('maskCardNumber should mask all but last 4 digits', () => {
    const pii = maskCardNumber('4111222233334444');
    expect(pii.masked).toBe('****4444');
    expect(pii.type).toBe('card_number');
  });

  it('maskEmail should mask the local part', () => {
    const pii = maskEmail('john.doe@example.com');
    expect(pii.masked).toBe('j***@example.com');
    expect(pii.type).toBe('email');
  });

  it('maskPhone should mask all but last 4 digits', () => {
    const pii = maskPhone('(555) 123-4567');
    expect(pii.masked).toBe('(***) ***-4567');
    expect(pii.type).toBe('phone');
  });

  it('maskSSN should mask all but last 4 digits', () => {
    const pii = maskSSN('123-45-6789');
    expect(pii.masked).toBe('***-**-6789');
    expect(pii.type).toBe('ssn');
  });
});
