/**
 * The state an Indian PIN code belongs to, from its first two digits.
 *
 * India's PIN codes are allocated by postal circle, and the first two digits
 * name the circle, so a state can be read off six digits without asking a
 * server. That saves the reader the one field on the checkout form nobody can
 * type from memory faster than they can pick it — and, unlike a lookup API, it
 * cannot be down, cannot be slow, and does not send a customer's address to a
 * third party while they are typing it.
 *
 * The table is deliberately incomplete. A prefix that spans two states is left
 * out rather than guessed:
 *
 *   40   Mumbai is 400 but Goa is 403
 *   24   Uttar Pradesh and Uttarakhand share it, as do 25 and 26
 *   73   West Bengal and Sikkim
 *   79   seven north-eastern states between them
 *
 * A missing prefix means the field is simply left alone. This only ever fills
 * an empty box, never corrects a full one, so the worst case for a prefix that
 * is right for most of its range and wrong for one district — 605 in Tamil
 * Nadu is Puducherry — is a reader changing a word they can see.
 */
const CIRCLES: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana",
  "13": "Haryana",
  "14": "Punjab",
  "15": "Punjab",
  "16": "Punjab",
  "17": "Himachal Pradesh",
  "18": "Jammu and Kashmir",
  "19": "Jammu and Kashmir",
  "20": "Uttar Pradesh",
  "21": "Uttar Pradesh",
  "22": "Uttar Pradesh",
  "23": "Uttar Pradesh",
  "27": "Uttar Pradesh",
  "28": "Uttar Pradesh",
  "30": "Rajasthan",
  "31": "Rajasthan",
  "32": "Rajasthan",
  "33": "Rajasthan",
  "34": "Rajasthan",
  "36": "Gujarat",
  "37": "Gujarat",
  "38": "Gujarat",
  "39": "Gujarat",
  "41": "Maharashtra",
  "42": "Maharashtra",
  "43": "Maharashtra",
  "44": "Maharashtra",
  "45": "Madhya Pradesh",
  "46": "Madhya Pradesh",
  "47": "Madhya Pradesh",
  "48": "Madhya Pradesh",
  "49": "Chhattisgarh",
  "50": "Telangana",
  "51": "Andhra Pradesh",
  "52": "Andhra Pradesh",
  "53": "Andhra Pradesh",
  "56": "Karnataka",
  "57": "Karnataka",
  "58": "Karnataka",
  "59": "Karnataka",
  "60": "Tamil Nadu",
  "61": "Tamil Nadu",
  "62": "Tamil Nadu",
  "63": "Tamil Nadu",
  "64": "Tamil Nadu",
  "67": "Kerala",
  "68": "Kerala",
  "69": "Kerala",
  "70": "West Bengal",
  "71": "West Bengal",
  "72": "West Bengal",
  "74": "West Bengal",
  "75": "Odisha",
  "76": "Odisha",
  "77": "Odisha",
  "78": "Assam",
  "80": "Bihar",
  "84": "Bihar",
  "85": "Bihar",
  "81": "Jharkhand",
  "82": "Jharkhand",
  "83": "Jharkhand",
}

/**
 * The state for a complete Indian PIN code, or null.
 *
 * Null for anything that is not six digits, for a country this does not know,
 * and for the prefixes above that would be a guess.
 */
export const stateFromPostalCode = (
  postalCode: string,
  countryCode?: string | null
): string | null => {
  if (countryCode?.toLowerCase() !== "in") {
    return null
  }

  const digits = postalCode.replace(/\D/g, "")

  if (digits.length !== 6) {
    return null
  }

  return CIRCLES[digits.slice(0, 2)] ?? null
}
