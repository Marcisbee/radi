import generateId from '../generateId';

describe('generateId.js', () => {
   it('generates a UUID', () => {
     const id = generateId();
     expect(typeof id).toBe('string');
     expect(id.length).toBe(36);
   });

   it('generates unique IDs', () => {
     expect(generateId()).not.toBe(generateId());
   });
});
