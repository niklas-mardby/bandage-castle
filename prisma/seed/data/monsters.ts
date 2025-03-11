// The famous residents of Bandage Castle, plus name parts for everyone else. 🐉🧌👻

export type NamedMonster = {
  key: string
  name: string
  species: string
  owner: string | null // customer key, null = surrendered / castle resident
  birthDate: string // YYYY-MM-DD, deliberately late in the year for some
  temperament: string
  quirks: string
  history: string
}

export const NAMED_MONSTERS: NamedMonster[] = [
  {
    key: 'snortlewick',
    name: 'Sir Snortlewick',
    species: 'Dragon',
    owner: 'morwenna',
    birthDate: '1823-11-30',
    temperament: 'Anxious, polite',
    quirks: 'Faints at the sight of swords. Also butter knives. Hums when nervous.',
    history: 'Lady Grimsby\'s guard dragon since 1901. Has been on boarding stays every winter since we opened.',
  },
  {
    key: 'mumbles',
    name: 'Mumbles',
    species: 'Troll',
    owner: 'grizelda',
    birthDate: '1952-12-14',
    temperament: 'Gentle, withdrawn',
    quirks: 'Will not cross bridges. Will not go under bridges. Will not discuss bridges.',
    history: 'Lost his bridge to a goat-related incident. In therapy for bridge trauma.',
  },
  {
    key: 'hester',
    name: 'Hester',
    species: 'Hydra',
    owner: 'vexmoor',
    birthDate: '1890-10-02',
    temperament: 'Five opinions at once',
    quirks: 'Five heads: Agnes, Bertha, Clementine, Dot and Eunice. Eunice bites.',
    history: 'Baron Vexmoor\'s moat guardian. Comes in for head-related injuries twice a year.',
  },
  {
    key: 'pebble',
    name: 'Pebble',
    species: 'Gargoyle',
    owner: 'grizelda',
    birthDate: '1712-09-21',
    temperament: 'Stoic',
    quirks: 'Pretends to be a statue whenever a vet walks in.',
    history: 'Fell off a cathedral during a thunderstorm. Chipped wing.',
  },
  {
    key: 'basil',
    name: 'Basil',
    species: 'Basilisk',
    owner: 'malgrim',
    birthDate: '1966-12-01',
    temperament: 'Sulky',
    quirks: 'Wears a little blindfold he made himself. Very proud of it.',
    history: 'Long-term boarder. Lord Malgrim is "renovating" Doomspire.',
  },
  {
    key: 'clucky',
    name: 'Clucky',
    species: 'Cockatrice',
    owner: null,
    birthDate: '2019-12-20',
    temperament: 'Furious',
    quirks: 'Crows at 3 a.m. Pecks keepers who wear yellow.',
    history: 'Surrendered after petrifying a tax collector. Looking for a new lair.',
  },
  {
    key: 'gloopert',
    name: 'Gloopert',
    species: 'Slime',
    owner: 'vexilla',
    birthDate: '2021-08-08',
    temperament: 'Curious',
    quirks: 'Escape artist. Has been found in the kitchen, the chapel and once inside a keeper\'s boot.',
    history: 'Regular boarder. See the tickets labelled "escaped slime".',
  },
  {
    key: 'whisper',
    name: 'Whisper',
    species: 'Wraith',
    owner: null,
    birthDate: '1650-10-31',
    temperament: 'Melancholy',
    quirks: 'Rearranges the furniture at night.',
    history: 'Came with the castle. Nobody surrendered her; she was just here.',
  },
  {
    key: 'fangsworth',
    name: 'Madame Fangsworth',
    species: 'Giant Spider',
    owner: 'morwenna',
    birthDate: '1988-12-24',
    temperament: 'Elegant, judgemental',
    quirks: 'Expects compliments on her webs. Will sulk for days without them.',
    history: 'Lady Grimsby\'s second monster. Comes along when Sir Snortlewick does, "for moral support".',
  },
  {
    key: 'bramble',
    name: 'Bramble',
    species: 'Griffin',
    owner: null,
    birthDate: '2010-11-11',
    temperament: 'Proud, loyal',
    quirks: 'Collects shiny buttons.',
    history: 'Surrendered when her knight retired. Excellent with children (and adventurers, sadly).',
  },
  {
    key: 'grumbold',
    name: 'Grumbold',
    species: 'Ogre',
    owner: null,
    birthDate: '1975-07-04',
    temperament: 'Sleepy',
    quirks: 'Snores in E flat.',
    history: 'Hired out three times. Always comes back. Possibly likes it here.',
  },
  {
    key: 'nibbles',
    name: 'Nibbles',
    species: 'Kobold',
    owner: 'vexmoor',
    birthDate: '2015-12-05',
    temperament: 'Terrified',
    quirks: 'Hides in teapots.',
    history: 'Afraid of torchlight. In therapy.',
  },
]

export const NAME_STARTS = [
  'Grum', 'Snag', 'Bog', 'Thorn', 'Mud', 'Scrat', 'Wob', 'Fizz', 'Glob', 'Crag', 'Murk', 'Pud', 'Skree', 'Bram', 'Gnash', 'Wart', 'Nib', 'Ooz',
  'Fang', 'Drib', 'Bumble', 'Spike', 'Crumb', 'Toad', 'Hob', 'Grizz', 'Snuff', 'Rattle', 'Moss', 'Ember',
] as const

export const NAME_ENDS = [
  'wick', 'bottom', 'kins', 'nose', 'gut', 'le', 'ington', 'bert', 'ella', 'ock', 'wort', 'paws', 'tooth', 'belly', 'by', 'fluff', 'snout', 'claw',
] as const

export const TEMPERAMENTS = [
  'Friendly', 'Grumpy', 'Shy', 'Boisterous', 'Sleepy', 'Nervous', 'Curious', 'Dramatic', 'Aloof', 'Clingy', 'Mischievous', 'Dignified', 'Peckish',
] as const

export const QUIRKS = [
  'Hoards spoons.',
  'Afraid of torchlight.',
  'Sings at dawn. Badly.',
  'Will only eat food arranged in a spiral.',
  'Sleeps upside down.',
  'Steals keepers\' hats.',
  'Allergic to garlic (and adventurers).',
  'Insists on a bedtime story.',
  'Counts treasure out loud. Loses count. Starts again.',
  'Terrified of mice.',
  'Glows faintly when happy.',
  'Collects pebbles and gives them names.',
  'Refuses to guard anything on Tuesdays.',
  'Sneezes sparks.',
  'Writes very bad poetry.',
] as const
