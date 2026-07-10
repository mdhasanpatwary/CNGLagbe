export const BAZAR_TRANSLITERATIONS: Record<string, string[]> = {
  "বক্তারহাট": ["boktarhat", "boktar hat", "boktar", "boctarhat", "boctar hat", "boctar"],
  "শুভপুর": ["shubopur", "shuvopur", "subopur", "shuvo pur", "shuvo", "subo", "shubhopur"],
  "ছাগলনাইয়া": ["chhagalnaiya", "chagalnaiya", "chagalnaiya", "chhagal", "chagal", "chhagalnaya", "chagalnaya"],
  "চাঁদগাজী": ["chandgazi", "chandgaji", "candgazi", "chand gazi", "chand gaje", "gazi"],
  "মির্জারহাট": ["mirzarhat", "mirzar hat", "mirjahuhat", "mirja", "mirzar", "mirjapur"],
  "ফেনী": ["feni", "fenee", "peni"],
  "দিলশাদ": ["dilshad", "dilsad"],
  "ঘোপাল": ["ghopal", "gopal"],
  "পৌরসভা": ["paurosava", "pourashava", "paurashava", "pourosava"],
  "মীর বাজার": ["mir bazar", "meer bazar", "mirbazar"],
  "দারোগারহাট": ["darogarhat", "darogar hat", "daroga"],
  "করিমগঞ্জ": ["karimganj", "karim ganj", "korimganj", "korim ganj"],
  "কৈয়ারা": ["koiyara", "kaiyara", "koyara"],
  "চৌধুরীহাট": ["chowdhuryhat", "chowdhury hat", "caudhuryhat"],
  "নতুন বাজার": ["notun bazar", "natun bazar", "notunbazar"],
};

export function isBanglaText(text: string): boolean {
  if (!text) return false;
  // Ensure it has at least one Bengali character
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  // Ensure it does not contain any English alphabetic characters
  const hasEnglish = /[a-zA-Z]/.test(text);
  return hasBengali && !hasEnglish;
}

export function getConsonantPhoneticRepresentation(text: string): string {
  const normalized = text.toLowerCase().trim();
  // If it contains English characters, process it as English
  if (/[a-zA-Z]/.test(normalized)) {
    return normalized
      .replace(/chh/g, "S")
      .replace(/ch/g, "S")
      .replace(/sh/g, "S")
      .replace(/s/g, "S")
      .replace(/z/g, "J")
      .replace(/jh/g, "J")
      .replace(/j/g, "J")
      .replace(/kh/g, "K")
      .replace(/k/g, "K")
      .replace(/q/g, "K")
      .replace(/c/g, "K")
      .replace(/gh/g, "G")
      .replace(/g/g, "G")
      .replace(/th/g, "T")
      .replace(/t/g, "T")
      .replace(/dh/g, "D")
      .replace(/d/g, "D")
      .replace(/ph/g, "P")
      .replace(/f/g, "P")
      .replace(/bh/g, "B")
      .replace(/v/g, "B")
      .replace(/b/g, "B")
      .replace(/h/g, "H")
      .replace(/r/g, "R")
      .replace(/l/g, "L")
      .replace(/m/g, "M")
      .replace(/n/g, "N")
      .replace(/ng/g, "N")
      .replace(/y/g, "") // ignore semi-vowel
      .replace(/w/g, "")
      .replace(/[^a-z]/g, "") // remove anything else
      .replace(/[aeiou]/g, ""); // remove vowels
  } else {
    // Process as Bangla
    let code = "";
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (/[\u0995\u0996]/.test(char)) code += "K"; // ক, খ
      else if (/[\u0997\u0998]/.test(char)) code += "G"; // গ, ঘ
      else if (/[\u099a\u099b]/.test(char)) code += "S"; // চ, ছ
      else if (/[\u099c\u099d\u09af]/.test(char)) code += "J"; // জ, ঝ, য
      else if (/[\u099f\u09a0\u09a4\u09a5]/.test(char)) code += "T"; // ট, ঠ, ত, থ
      else if (/[\u09a1\u09a2\u09a6\u09a7]/.test(char)) code += "D"; // ড, ঢ, দ, ধ
      else if (/[\u09aa\u09ab]/.test(char)) code += "P"; // প, ফ
      else if (/[\u09ac\u09ad]/.test(char)) code += "B"; // ব, ভ
      else if (/[\u09ae]/.test(char)) code += "M"; // ম
      else if (/[\u09a8\u09a3\u099e\u0999\u0982]/.test(char)) code += "N"; // ন, ণ, ঞ, ঙ, ং
      else if (/[\u09b0\u09dc\u09dd]/.test(char)) code += "R"; // র, ড়, ঢ়
      else if (/[\u09b2]/.test(char)) code += "L"; // ল
      else if (/[\u09b6\u09b7\u09b8]/.test(char)) code += "S"; // শ, ষ, স
      else if (/[\u09b9]/.test(char)) code += "H"; // হ
    }
    return code;
  }
}

export function isPhoneticMatch(query: string, target: string): boolean {
  const queryPhonetic = getConsonantPhoneticRepresentation(query);
  const targetPhonetic = getConsonantPhoneticRepresentation(target);
  if (!queryPhonetic || !targetPhonetic) return false;
  if (queryPhonetic.length < 2) return false; // Require at least 2 consonant sounds to avoid overmatching
  return targetPhonetic.includes(queryPhonetic) || queryPhonetic.includes(targetPhonetic);
}

export function mapEnglishToBanglaBazars(query: string, bazars: string[] = []): string[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  const matched = new Set<string>();

  // 1. Try static dictionary matching
  for (const [banglaName, englishList] of Object.entries(BAZAR_TRANSLITERATIONS)) {
    const isMatch = englishList.some(alias => 
      alias.includes(normalized) || normalized.includes(alias)
    );
    if (isMatch) {
      matched.add(banglaName);
    }
  }

  // 2. Try dynamic phonetic matching
  const queryPhonetic = getConsonantPhoneticRepresentation(normalized);
  if (queryPhonetic.length >= 2) {
    for (const bazarName of bazars) {
      const bazarPhonetic = getConsonantPhoneticRepresentation(bazarName);
      if (
        bazarPhonetic.startsWith(queryPhonetic) || 
        queryPhonetic.startsWith(bazarPhonetic)
      ) {
        matched.add(bazarName);
      }
    }
  }

  return Array.from(matched);
}
