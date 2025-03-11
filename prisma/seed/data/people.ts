// Customers and name parts for the generated ones.

export type NamedCustomer = {
  key: string
  title: string
  firstName: string
  lastName: string
  email: string
  contactPref: 'raven' | 'crystal ball' | 'email'
  lairAddress: string
  notes: string
}

export const NAMED_CUSTOMERS: NamedCustomer[] = [
  {
    key: 'morwenna',
    title: 'Lady',
    firstName: 'Morwenna',
    lastName: 'Grimsby',
    email: 'owner@bandage.castle',
    contactPref: 'crystal ball',
    lairAddress: 'Grimsby Crypt, Third Mausoleum on the Left, Hollowmere',
    notes: 'Necromancer. Very demanding. Insists on speaking to "the manager" (there is no manager). Always pays, always late.',
  },
  {
    key: 'vexmoor',
    title: 'Baron',
    firstName: 'Aldric',
    lastName: 'Vexmoor',
    email: 'overlord@bandage.castle',
    contactPref: 'raven',
    lairAddress: 'Castle Vexmoor, Blackfen Marshes',
    notes: 'Owns Hester the hydra. Also hires monsters for his many dungeons. Counts heads personally.',
  },
  {
    key: 'grizelda',
    title: 'Mistress',
    firstName: 'Grizelda',
    lastName: 'Hexwort',
    email: 'grizelda@bandage.castle',
    contactPref: 'raven',
    lairAddress: 'The Crooked Cottage, Thornwood (follow the screaming)',
    notes: 'Hedge witch. Brings biscuits. Allergic to cats, owns three gargoyles.',
  },
  {
    key: 'malgrim',
    title: 'Lord',
    firstName: 'Malgrim',
    lastName: 'the Unpleasant',
    email: 'malgrim@doomspire.example',
    contactPref: 'email',
    lairAddress: 'Doomspire Tower, top floor (lift broken)',
    notes: 'Prefers email. Says ravens are "for peasants".',
  },
  {
    key: 'vexilla',
    title: 'Dread Sorceress',
    firstName: 'Vexilla',
    lastName: 'Nightbloom',
    email: 'vexilla@nightbloom.example',
    contactPref: 'crystal ball',
    lairAddress: 'The Obsidian Greenhouse, Mirewood',
    notes: 'Collects rare monsters. Asks a lot of questions about the Hiring Hall.',
  },
]

export const TITLES = ['Lord', 'Lady', 'Baron', 'Baroness', 'Count', 'Countess', 'Archmage', 'Warlock', 'Dread Lord', 'Necromancer', 'Witch', 'Duke', 'Duchess', 'Sir', 'Dame', 'Overlord'] as const

export const FIRST_NAMES = [
  'Mordecai', 'Belladonna', 'Grimwald', 'Esmeralda', 'Thaddeus', 'Lucretia', 'Barnaby', 'Hecate', 'Ignatius', 'Ophelia', 'Cornelius', 'Drusilla',
  'Fenwick', 'Griselda', 'Horace', 'Isolde', 'Jasper', 'Katarina', 'Leopold', 'Mildred', 'Nigel', 'Petronella', 'Quentin', 'Rowena', 'Septimus',
  'Theodora', 'Ulric', 'Valentina', 'Wilhelmina', 'Xavier', 'Ysolde', 'Zebedee', 'Agatha', 'Bartholomew', 'Cressida', 'Desmond',
] as const

export const LAST_NAMES = [
  'Blackthorne', 'Cinderwick', 'Dreadmoor', 'Ebonheart', 'Fogbottom', 'Gloomsworth', 'Hollowbone', 'Ironfang', 'Jadeskull', 'Knucklebury', 'Lichwood',
  'Murkwater', 'Nettlebane', 'Oddsock', 'Plaguestone', 'Quillfeather', 'Ravenhurst', 'Shadowmere', 'Thistlegrave', 'Umbrage', 'Vilecastle',
  'Wormwood', 'Yellowtooth', 'Zephyrstorm', 'Bogswallow', 'Crowbottom', 'Duskvale', 'Grimbly', 'Spitefield', 'Toadsworth',
] as const

export const PLACES = [
  'the Howling Fens', 'Mount Gloom', 'the Sunken Abbey', 'Bleakwater', 'the Ashen Wastes', 'Thornwood', 'the Rotting Marches', 'Cragmoor',
  'the Whispering Caves', 'Lake Murk', 'the Bone Coast', 'Grimhollow', 'the Crooked Peaks', 'Saltmire',
] as const

export const LAIR_KINDS = ['Tower', 'Keep', 'Crypt', 'Cave', 'Fortress', 'Manor', 'Citadel', 'Bog Hut', 'Spire', 'Dungeon'] as const
