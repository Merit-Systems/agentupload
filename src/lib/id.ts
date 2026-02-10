import { customAlphabet } from "nanoid";

// 30-char alphabet: no ambiguous characters (0/O, 1/l/I)
// 10 chars → 30^10 ≈ 590 trillion combinations
const alphabet = "23456789abcdefghjkmnpqrstvwxyz";

export const generateId = customAlphabet(alphabet, 10);
