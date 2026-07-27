import type { ComponentType } from "react";

export type AvatarId =
  | "lion"
  | "eagle"
  | "sheep"
  | "rabbit"
  | "fox"
  | "tiger"
  | "man-laugh"
  | "woman-wink"
  | "man-shock"
  | "woman-calm";

export const AVATAR_IDS = [
  "lion",
  "eagle",
  "sheep",
  "rabbit",
  "fox",
  "tiger",
  "man-laugh",
  "woman-wink",
  "man-shock",
  "woman-calm",
] as const satisfies readonly AvatarId[];

function LionAvatar() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Avatar Singa">
      <defs>
        <clipPath id="avatar-lion-clip">
          <circle cx="100" cy="100" r="95" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-lion-clip)">
        <circle cx="100" cy="100" r="95" fill="#BAE6FD" />
        <g transform="translate(100,100) scale(1.3)">
          <path transform="rotate(0)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(22.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(45)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(67.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(90)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(112.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(135)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(157.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(180)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(202.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(225)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(247.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(270)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(292.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path transform="rotate(315)" d="M -10,-46 L 0,-80 L 10,-46 Z" fill="#92400E" />
          <path transform="rotate(337.5)" d="M -8,-46 L 0,-72 L 8,-46 Z" fill="#B45309" />
          <path d="M -30,-56 Q -38,-70 -24,-74 Q -14,-68 -18,-54 Z" fill="#F5C16C" stroke="#B45309" strokeWidth="1" />
          <path d="M -26,-58 Q -30,-66 -22,-68 Q -18,-64 -20,-56 Z" fill="#B45309" />
          <path d="M 30,-56 Q 38,-70 24,-74 Q 14,-68 18,-54 Z" fill="#F5C16C" stroke="#B45309" strokeWidth="1" />
          <path d="M 26,-58 Q 30,-66 22,-68 Q 18,-64 20,-56 Z" fill="#B45309" />
          <path
            d="M -44,-10 Q -48,-40 -20,-46 Q 0,-50 20,-46 Q 48,-40 44,-10 Q 46,20 24,38 Q 10,48 0,48 Q -10,48 -24,38 Q -46,20 -44,-10 Z"
            fill="#F5C16C"
          />
          <ellipse cx="0" cy="28" rx="20" ry="16" fill="#FBE3B8" />
          <path d="M -24,-8 Q -16,-18 -8,-8 Q -16,-2 -24,-8 Z" fill="#FFF7ED" />
          <circle cx="-16" cy="-9" r="5" fill="#7C2D12" />
          <circle cx="-16" cy="-9" r="2.2" fill="#1C1C1C" />
          <path d="M -26,-20 Q -16,-26 -6,-20" stroke="#7C2D12" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 24,-8 Q 16,-18 8,-8 Q 16,-2 24,-8 Z" fill="#FFF7ED" />
          <circle cx="16" cy="-9" r="5" fill="#7C2D12" />
          <circle cx="16" cy="-9" r="2.2" fill="#1C1C1C" />
          <path d="M 26,-20 Q 16,-26 6,-20" stroke="#7C2D12" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M -9,22 Q 0,16 9,22 Q 9,28 0,32 Q -9,28 -9,22 Z" fill="#5C2410" />
          <path
            d="M 0,32 L 0,36 M 0,36 Q -10,44 -20,38 M 0,36 Q 10,44 20,38"
            stroke="#5C2410"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="-32" cy="24" r="1.4" fill="#7C2D12" opacity="0.6" />
          <circle cx="-34" cy="30" r="1.4" fill="#7C2D12" opacity="0.6" />
          <circle cx="-32" cy="36" r="1.4" fill="#7C2D12" opacity="0.6" />
          <circle cx="32" cy="24" r="1.4" fill="#7C2D12" opacity="0.6" />
          <circle cx="34" cy="30" r="1.4" fill="#7C2D12" opacity="0.6" />
          <circle cx="32" cy="36" r="1.4" fill="#7C2D12" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}

function EagleAvatar() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Avatar Elang">
      <defs>
        <clipPath id="avatar-eagle-clip">
          <circle cx="100" cy="100" r="95" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-eagle-clip)">
        <circle cx="100" cy="100" r="95" fill="#1E293B" />
        <g transform="translate(100,100) scale(1.3)">
          <path
            d="M -40,-8 Q -44,-38 -18,-44 Q 0,-48 18,-44 Q 44,-38 40,-8 Q 42,14 20,30 Q 8,38 0,38 Q -8,38 -20,30 Q -42,14 -40,-8 Z"
            fill="#F5F1E8"
          />
          <path d="M -8,-46 L -4,-58 L 0,-46 Z" fill="#F5F1E8" stroke="#D4CBB5" strokeWidth="1" />
          <path d="M -3,-48 L 0,-62 L 3,-48 Z" fill="#F5F1E8" stroke="#D4CBB5" strokeWidth="1" />
          <path d="M 0,-46 L 4,-58 L 8,-46 Z" fill="#F5F1E8" stroke="#D4CBB5" strokeWidth="1" />
          <path d="M -6,-44 Q -8,-30 -6,-18" stroke="#DDD3BE" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 6,-44 Q 8,-30 6,-18" stroke="#DDD3BE" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M -22,-36 Q -26,-20 -20,-6" stroke="#DDD3BE" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 22,-36 Q 26,-20 20,-6" stroke="#DDD3BE" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M -30,-18 Q -18,-30 -6,-20 L -8,-14 Q -18,-22 -28,-12 Z" fill="#E8E2D0" />
          <path d="M 30,-18 Q 18,-30 6,-20 L 8,-14 Q 18,-22 28,-12 Z" fill="#E8E2D0" />
          <circle cx="-18" cy="-14" r="7" fill="#F5B90A" />
          <circle cx="-18" cy="-14" r="3.5" fill="#1C1C1C" />
          <circle cx="-20" cy="-16" r="1.2" fill="#FFFFFF" />
          <circle cx="18" cy="-14" r="7" fill="#F5B90A" />
          <circle cx="18" cy="-14" r="3.5" fill="#1C1C1C" />
          <circle cx="16" cy="-16" r="1.2" fill="#FFFFFF" />
          <path
            d="M -14,2 Q 0,-4 14,2 Q 18,10 12,18 Q 4,26 -2,26 Q -8,24 -10,16 Q -16,12 -14,2 Z"
            fill="#F5A623"
            stroke="#C97D0A"
            strokeWidth="1.5"
          />
          <path d="M -2,20 Q 2,24 6,20 Q 4,28 -2,26 Z" fill="#D98E12" />
          <path
            d="M -8,20 Q 0,26 8,20 Q 6,28 0,30 Q -6,28 -8,20 Z"
            fill="#E89B1C"
            stroke="#C97D0A"
            strokeWidth="1"
          />
          <circle cx="-8" cy="4" r="1.5" fill="#1C1C1C" />
        </g>
      </g>
    </svg>
  );
}

function SheepAvatar() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Avatar Domba">
      <defs>
        <clipPath id="avatar-sheep-clip">
          <circle cx="110" cy="110" r="100" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-sheep-clip)">
        <circle cx="110" cy="110" r="100" fill="#BBF7D0" />
        <g transform="translate(110,110)">
          <circle cx="0" cy="-55" r="20" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="23.5" cy="-47.7" r="20" fill="#F1F5F9" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="38" cy="-27.6" r="20" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="38" cy="-2.4" r="20" fill="#F1F5F9" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="23.5" cy="17.7" r="20" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="0" cy="25" r="20" fill="#F1F5F9" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="-23.5" cy="17.7" r="20" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="-38" cy="-2.4" r="20" fill="#F1F5F9" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="-38" cy="-27.6" r="20" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="-23.5" cy="-47.7" r="20" fill="#F1F5F9" stroke="#1C1C1C" strokeWidth="4" />
          <ellipse cx="0" cy="50" rx="32" ry="36" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="5" />
          <circle cx="-20" cy="20" r="14" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="0" cy="14" r="14" fill="#F1F5F9" stroke="#1C1C1C" strokeWidth="4" />
          <circle cx="20" cy="20" r="14" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="4" />
          <ellipse cx="-14" cy="82" rx="10" ry="7" fill="#4B4038" stroke="#1C1C1C" strokeWidth="3" />
          <ellipse cx="14" cy="82" rx="10" ry="7" fill="#4B4038" stroke="#1C1C1C" strokeWidth="3" />
          <g transform="translate(0,8) rotate(8 0 -15)">
            <path d="M -30,-18 Q -40,-5 -32,10 Q -26,4 -24,-16 Z" fill="#4B4038" stroke="#1C1C1C" strokeWidth="3" />
            <path d="M 30,-18 Q 40,-5 32,10 Q 26,4 24,-16 Z" fill="#4B4038" stroke="#1C1C1C" strokeWidth="3" />
            <circle cx="0" cy="-15" r="26" fill="#4B4038" stroke="#1C1C1C" strokeWidth="4" />
            <ellipse cx="0" cy="-3" rx="10" ry="7" fill="#6B5B4F" />
            <circle cx="-10" cy="-16" r="5" fill="#FFFFFF" />
            <circle cx="10" cy="-16" r="5" fill="#FFFFFF" />
            <circle cx="-10" cy="-15" r="3" fill="#1C1C1C" />
            <circle cx="10" cy="-15" r="3" fill="#1C1C1C" />
            <circle cx="-11.2" cy="-17" r="1" fill="#FFFFFF" />
            <circle cx="8.8" cy="-17" r="1" fill="#FFFFFF" />
            <circle cx="-3" cy="-4" r="1.3" fill="#1C1C1C" />
            <circle cx="3" cy="-4" r="1.3" fill="#1C1C1C" />
            <path d="M 0,0 Q -4,4 -8,2" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 0,0 Q 4,4 8,2" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}

function RabbitAvatar() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Avatar Kelinci">
      <defs>
        <clipPath id="avatar-rabbit-clip">
          <circle cx="110" cy="110" r="100" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-rabbit-clip)">
        <circle cx="110" cy="110" r="100" fill="#FED7AA" />
        <g transform="translate(110,110)">
          <g transform="rotate(-8)">
            <circle cx="-28" cy="62" r="9" fill="#FFFFFF" stroke="#1C1C1C" strokeWidth="3" />
            <ellipse cx="0" cy="52" rx="32" ry="34" fill="#E5E7EB" stroke="#1C1C1C" strokeWidth="5" />
            <ellipse cx="0" cy="56" rx="16" ry="18" fill="#FFFFFF" />
            <ellipse cx="-8" cy="82" rx="11" ry="8" fill="#E5E7EB" stroke="#1C1C1C" strokeWidth="4" />
            <ellipse cx="14" cy="80" rx="11" ry="8" fill="#E5E7EB" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="-28" cy="44" r="10" fill="#E5E7EB" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="26" cy="40" r="10" fill="#E5E7EB" stroke="#1C1C1C" strokeWidth="4" />
            <path
              d="M -22,-60 Q -28,-110 -14,-118 Q -6,-112 -10,-62 Z"
              fill="#E5E7EB"
              stroke="#1C1C1C"
              strokeWidth="4"
            />
            <path d="M -20,-64 Q -24,-104 -15,-110 Q -10,-105 -13,-64 Z" fill="#F9A8D4" />
            <path
              d="M 20,-60 Q 40,-90 28,-105 Q 14,-100 10,-70 Q 8,-64 20,-60 Z"
              fill="#E5E7EB"
              stroke="#1C1C1C"
              strokeWidth="4"
            />
            <path d="M 18,-66 Q 30,-88 24,-98 Q 16,-94 14,-70 Z" fill="#F9A8D4" />
            <circle cx="0" cy="-24" r="42" fill="#E5E7EB" stroke="#1C1C1C" strokeWidth="5" />
            <ellipse cx="-22" cy="-10" rx="6" ry="4" fill="#F7A6A0" opacity="0.6" />
            <ellipse cx="22" cy="-10" rx="6" ry="4" fill="#F7A6A0" opacity="0.6" />
            <circle cx="-15" cy="-26" r="7" fill="#1C1C1C" />
            <circle cx="15" cy="-26" r="7" fill="#1C1C1C" />
            <circle cx="-16.5" cy="-28.5" r="2" fill="#FFFFFF" />
            <circle cx="13.5" cy="-28.5" r="2" fill="#FFFFFF" />
            <ellipse cx="0" cy="-10" rx="4" ry="3" fill="#F472B6" />
            <path
              d="M 0,-7 L 0,-4 M 0,-4 Q -5,2 -9,-1 M 0,-4 Q 5,2 9,-1"
              stroke="#1C1C1C"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

function FoxAvatar() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Avatar Rubah">
      <defs>
        <clipPath id="avatar-fox-clip">
          <circle cx="110" cy="110" r="100" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-fox-clip)">
        <circle cx="110" cy="110" r="100" fill="#5EEAD4" />
        <g transform="translate(110,110)">
          <g transform="rotate(-10)">
            <path
              d="M 15,50 Q 55,20 55,-15 Q 55,-40 35,-40 Q 50,-20 40,5 Q 30,30 15,55 Z"
              fill="#F0883E"
              stroke="#1C1C1C"
              strokeWidth="4"
            />
            <ellipse cx="48" cy="-25" rx="12" ry="14" fill="#FFF7ED" stroke="#1C1C1C" strokeWidth="3" />
            <ellipse cx="0" cy="48" rx="32" ry="36" fill="#F0883E" stroke="#1C1C1C" strokeWidth="5" />
            <path d="M 0,20 Q -14,35 -10,55 Q 0,66 10,55 Q 14,35 0,20 Z" fill="#FFF7ED" />
            <ellipse cx="-10" cy="74" rx="11" ry="8" fill="#F0883E" stroke="#1C1C1C" strokeWidth="4" />
            <ellipse cx="24" cy="88" rx="11" ry="8" fill="#F0883E" stroke="#1C1C1C" strokeWidth="4" />
            <ellipse
              cx="-34"
              cy="30"
              rx="10"
              ry="13"
              transform="rotate(20 -34 30)"
              fill="#F0883E"
              stroke="#1C1C1C"
              strokeWidth="4"
            />
            <circle cx="30" cy="60" r="10" fill="#F0883E" stroke="#1C1C1C" strokeWidth="4" />
            <ellipse cx="0" cy="-22" rx="40" ry="42" fill="#F0883E" stroke="#1C1C1C" strokeWidth="5" />
            <path d="M -16,-4 Q 0,-2 16,-4 Q 12,16 0,20 Q -12,16 -16,-4 Z" fill="#FFF7ED" />
            <path d="M -32,-52 L -20,-82 L -6,-54 Z" fill="#F0883E" stroke="#1C1C1C" strokeWidth="4" />
            <path d="M -26,-56 L -19,-74 L -12,-56 Z" fill="#FFF7ED" />
            <path d="M 30,-46 L 42,-68 L 12,-52 Z" fill="#F0883E" stroke="#1C1C1C" strokeWidth="4" />
            <path d="M 26,-48 L 36,-62 L 16,-50 Z" fill="#FFF7ED" />
            <ellipse cx="-20" cy="-6" rx="6" ry="4" fill="#F7A6A0" opacity="0.6" />
            <ellipse cx="20" cy="-6" rx="6" ry="4" fill="#F7A6A0" opacity="0.6" />
            <ellipse cx="-15" cy="-22" rx="6" ry="7" fill="#1C1C1C" />
            <ellipse cx="15" cy="-22" rx="6" ry="7" fill="#1C1C1C" />
            <circle cx="-16.5" cy="-25" r="1.5" fill="#FFFFFF" />
            <circle cx="13.5" cy="-25" r="1.5" fill="#FFFFFF" />
            <path d="M -4,14 L 4,14 L 0,20 Z" fill="#1C1C1C" />
            <path d="M -7,15 Q 0,27 7,15 Q 0,20 -7,15 Z" fill="#7A2E22" />
          </g>
        </g>
      </g>
    </svg>
  );
}

function TigerAvatar() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Avatar Harimau">
      <defs>
        <clipPath id="avatar-tiger-clip">
          <circle cx="110" cy="110" r="100" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-tiger-clip)">
        <circle cx="110" cy="110" r="100" fill="#C7D2FE" />
        <g transform="translate(110,110)">
          <g transform="rotate(6)">
            <path
              d="M 15,50 Q 45,55 55,35 Q 62,20 55,5 Q 60,20 48,32 Q 35,45 15,58 Z"
              fill="#F3924A"
              stroke="#1C1C1C"
              strokeWidth="4"
            />
            <path d="M 40,40 L 46,32" stroke="#2B2019" strokeWidth="4" strokeLinecap="round" />
            <path d="M 48,25 L 54,18" stroke="#2B2019" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="0" cy="48" rx="34" ry="38" fill="#F3924A" stroke="#1C1C1C" strokeWidth="5" />
            <ellipse cx="0" cy="52" rx="18" ry="22" fill="#FFF7ED" />
            <ellipse cx="-12" cy="76" rx="11" ry="8" fill="#F3924A" stroke="#1C1C1C" strokeWidth="4" />
            <ellipse cx="20" cy="88" rx="11" ry="8" fill="#F3924A" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="-32" cy="46" r="10" fill="#F3924A" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="30" cy="56" r="10" fill="#F3924A" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="0" cy="-22" r="44" fill="#F3924A" stroke="#1C1C1C" strokeWidth="5" />
            <ellipse cx="0" cy="-6" rx="20" ry="15" fill="#FFF7ED" />
            <circle cx="-28.3" cy="-55.7" r="15" fill="#F3924A" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="-28.3" cy="-55.7" r="7" fill="#FFF7ED" />
            <circle cx="34" cy="-42" r="14" fill="#F3924A" stroke="#1C1C1C" strokeWidth="4" />
            <circle cx="34" cy="-42" r="6" fill="#FFF7ED" />
            <path d="M -10,-58 Q -14,-46 -8,-36" stroke="#2B2019" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 10,-58 Q 14,-46 8,-36" stroke="#2B2019" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path
              d="M -34,-28 Q -28,-16 -34,-4"
              stroke="#2B2019"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 30,-30 Q 26,-18 30,-6" stroke="#2B2019" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M -26,36 Q -20,48 -26,60" stroke="#2B2019" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 26,36 Q 20,48 26,60" stroke="#2B2019" strokeWidth="5" fill="none" strokeLinecap="round" />
            <ellipse cx="-22" cy="-10" rx="7" ry="5" fill="#F7A6A0" opacity="0.6" />
            <ellipse cx="22" cy="-10" rx="7" ry="5" fill="#F7A6A0" opacity="0.6" />
            <circle cx="-13" cy="-20" r="7" fill="#1C1C1C" />
            <circle cx="19" cy="-20" r="7" fill="#1C1C1C" />
            <circle cx="-14.5" cy="-22.5" r="2" fill="#FFFFFF" />
            <circle cx="17.5" cy="-22.5" r="2" fill="#FFFFFF" />
            <ellipse cx="0" cy="-2" rx="5" ry="3.5" fill="#1C1C1C" />
            <path d="M -8,4 Q 0,10 8,4" stroke="#1C1C1C" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}

function ManLaughAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Avatar Pria Tertawa">
      <defs>
        <clipPath id="avatar-man-laugh-clip">
          <circle cx="80" cy="80" r="70" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-man-laugh-clip)">
        <circle cx="80" cy="80" r="70" fill="#D9F99D" />
        <g transform="translate(80,80)">
          <circle cx="0" cy="4" r="58" fill="#E8B08A" />
          <path
            d="M -55,-8 Q -55,-60 0,-64 Q 55,-60 55,-8 Q 55,-28 40,-38 Q 20,-46 0,-46 Q -20,-46 -40,-38 Q -55,-28 -55,-8 Z"
            fill="#3B2A20"
          />
          <path d="M -24,-20 Q -14,-26 -4,-20" fill="none" stroke="#3B2A20" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 4,-20 Q 14,-26 24,-20" fill="none" stroke="#3B2A20" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M -22,-6 Q -14,-16 -6,-6" fill="none" stroke="#3B2A20" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 6,-6 Q 14,-16 22,-6" fill="none" stroke="#3B2A20" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="-30" cy="12" r="8" fill="#F4A5A0" opacity="0.5" />
          <circle cx="30" cy="12" r="8" fill="#F4A5A0" opacity="0.5" />
          <ellipse cx="0" cy="20" rx="16" ry="10" fill="#7A2E22" />
          <path d="M -14,13 Q 0,19 14,13 Q 14,17 0,19 Q -14,17 -14,13 Z" fill="#FFFFFF" />
        </g>
      </g>
    </svg>
  );
}

function WomanWinkAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Avatar Wanita Mengedip">
      <defs>
        <clipPath id="avatar-woman-wink-clip">
          <circle cx="80" cy="80" r="70" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-woman-wink-clip)">
        <circle cx="80" cy="80" r="70" fill="#99F6E4" />
        <g transform="translate(80,80)">
          <circle cx="0" cy="4" r="58" fill="#EFC49A" />
          <path
            d="M -55,-8 Q -55,-58 0,-62 Q 55,-58 55,-8 Q 40,-30 0,-34 Q -40,-30 -55,-8 Z"
            fill="#6B3F2A"
          />
          <path d="M -55,-8 Q -60,20 -48,44 Q -56,18 -52,-4 Z" fill="#6B3F2A" />
          <path d="M 55,-8 Q 60,20 48,44 Q 56,18 52,-4 Z" fill="#6B3F2A" />
          <path d="M -28,-20 Q -18,-25 -8,-21" fill="none" stroke="#6B3F2A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 8,-19 Q 18,-23 28,-19" fill="none" stroke="#6B3F2A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M -26,-8 Q -18,-16 -10,-8 Q -18,-2 -26,-8 Z" fill="#FFFFFF" />
          <circle cx="-18" cy="-8" r="3" fill="#3B2A20" />
          <path d="M -24,-14 L -27,-17" fill="none" stroke="#3B2A20" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 10,-8 Q 18,-4 26,-8" fill="none" stroke="#3B2A20" strokeWidth="2" strokeLinecap="round" />
          <path d="M 24,-11 L 28,-13" fill="none" stroke="#3B2A20" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-28" cy="16" r="7" fill="#F4A5A0" opacity="0.5" />
          <path d="M -16,18 Q 2,26 20,12" fill="none" stroke="#7A2E22" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function ManShockAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Avatar Pria Terkejut">
      <defs>
        <clipPath id="avatar-man-shock-clip">
          <circle cx="80" cy="80" r="70" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-man-shock-clip)">
        <circle cx="80" cy="80" r="70" fill="#93C5FD" />
        <g transform="translate(80,80)">
          <circle cx="0" cy="4" r="58" fill="#C68A5B" />
          <path
            d="M -50,-6 Q -50,-56 0,-60 Q 50,-56 50,-6 Q 50,-20 35,-30 Q 15,-40 0,-40 Q -15,-40 -35,-30 Q -50,-20 -50,-6 Z"
            fill="#1C1512"
          />
          <path d="M -26,-26 Q -16,-34 -6,-28" fill="none" stroke="#1C1512" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 6,-28 Q 16,-34 26,-26" fill="none" stroke="#1C1512" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="-16" cy="-10" r="9" fill="#FFFFFF" />
          <circle cx="-16" cy="-9" r="5" fill="#1C1512" />
          <circle cx="16" cy="-10" r="9" fill="#FFFFFF" />
          <circle cx="16" cy="-9" r="5" fill="#1C1512" />
          <ellipse cx="0" cy="16" rx="10" ry="12" fill="#7A2E22" />
        </g>
      </g>
    </svg>
  );
}

function WomanCalmAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Avatar Wanita Tenang">
      <defs>
        <clipPath id="avatar-woman-calm-clip">
          <circle cx="80" cy="80" r="70" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-woman-calm-clip)">
        <circle cx="80" cy="80" r="70" fill="#FBCFE8" />
        <g transform="translate(80,80)">
          <circle cx="0" cy="4" r="58" fill="#F0C9A0" />
          <path
            d="M -52,-6 Q -52,-58 0,-62 Q 52,-58 52,-6 Q 40,-26 0,-30 Q -40,-26 -52,-6 Z"
            fill="#2B1F1A"
          />
          <path d="M 40,-40 Q 60,-46 62,-20 Q 60,0 44,-6 Q 54,-24 40,-40 Z" fill="#2B1F1A" />
          <path d="M -24,-20 Q -16,-24 -8,-21" fill="none" stroke="#2B1F1A" strokeWidth="2" strokeLinecap="round" />
          <path d="M 8,-21 Q 16,-24 24,-20" fill="none" stroke="#2B1F1A" strokeWidth="2" strokeLinecap="round" />
          <path d="M -24,-8 Q -16,-4 -8,-8" fill="none" stroke="#2B1F1A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 8,-8 Q 16,-4 24,-8" fill="none" stroke="#2B1F1A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="-26" cy="10" r="7" fill="#F4A5A0" opacity="0.5" />
          <circle cx="26" cy="10" r="7" fill="#F4A5A0" opacity="0.5" />
          <path d="M -10,16 Q 0,20 10,16" fill="none" stroke="#7A2E22" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export const AVATAR_CATALOG: { id: AvatarId; label: string; Component: ComponentType }[] = [
  { id: "lion", label: "Singa", Component: LionAvatar },
  { id: "eagle", label: "Elang", Component: EagleAvatar },
  { id: "sheep", label: "Domba", Component: SheepAvatar },
  { id: "rabbit", label: "Kelinci", Component: RabbitAvatar },
  { id: "fox", label: "Rubah", Component: FoxAvatar },
  { id: "tiger", label: "Harimau", Component: TigerAvatar },
  { id: "man-laugh", label: "Pria Tertawa", Component: ManLaughAvatar },
  { id: "woman-wink", label: "Wanita Mengedip", Component: WomanWinkAvatar },
  { id: "man-shock", label: "Pria Terkejut", Component: ManShockAvatar },
  { id: "woman-calm", label: "Wanita Tenang", Component: WomanCalmAvatar },
];

export function getAvatarComponent(avatarId: string | null): ComponentType | null {
  return AVATAR_CATALOG.find((avatar) => avatar.id === avatarId)?.Component ?? null;
}
