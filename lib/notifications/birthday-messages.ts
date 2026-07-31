const SELF_BIRTHDAY_MESSAGE_TEMPLATES = [
  "Happy Birthday {name}, Jesus Loves You ❤️",
  "Happy Birthday {name}, Tuhan Yesus memberkati 🙏",
  "HBD {name}! Damai sejahtera & sukacita Tuhan selalu menyertaimu 🎉",
  "Happy Birthday {name}! Walking with God always ❤️",
];

export function pickSelfBirthdayMessage(fullName: string): string {
  const template =
    SELF_BIRTHDAY_MESSAGE_TEMPLATES[Math.floor(Math.random() * SELF_BIRTHDAY_MESSAGE_TEMPLATES.length)];
  return template.replace("{name}", fullName);
}
