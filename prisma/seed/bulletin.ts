// The castle notice board. 📜
import type { PrismaClient } from '@prisma/client'
import { at } from './random'
import type { World } from './world'

type Entry = { title: string; kind: 'PAGE' | 'POST'; daysAgo: number; pinned?: boolean; draft?: boolean; body: string }

const ENTRIES: Entry[] = [
  {
    title: 'Welcome to the Bulletin',
    kind: 'POST',
    daysAgo: 160,
    pinned: true,
    body: `The castle notice board has moved into the app! 🎉

No more soggy parchment on the kitchen door. Scribes will post **news**, and we will keep **pages** with the things everyone needs to know.

- 📰 *Posts* are news: arrivals, events, warnings
- 📘 *Pages* are how-tos that stay up to date

Questions? Ask a scribe. — *The Scribes' Guild*`,
  },
  {
    title: 'Fire safety in the North Tower',
    kind: 'PAGE',
    daysAgo: 150,
    pinned: true,
    body: `# 🔥 Fire safety

The North Tower houses our **fire-breathing** residents. Please:

1. Keep a bucket of sand by every lair door
2. Never enter the Ember Vault wearing anything flammable (yes, that includes your *good* cloak)
3. If a dragon sneezes, **duck**

| Lair | Extinguisher | Last checked |
| --- | --- | --- |
| The Ember Vault | sand + blanket | monthly |
| The Rookery | water | weekly |

> "A singed keeper is a careless keeper." — Old Hobb`,
  },
  {
    title: 'How to feed a basilisk safely',
    kind: 'PAGE',
    daysAgo: 140,
    body: `# 🐍 Feeding a basilisk

**Never** look a basilisk in the eye. Ever.

1. Put on a **mirrored visor** (hook by the Stone Garden door)
2. Walk in *backwards*
3. Slide the rat bowl along the floor
4. Leave. Do not wave goodbye.

If the visor hook is empty, open a ticket and **do not go in**.`,
  },
  {
    title: 'Sir Snortlewick is back for the winter',
    kind: 'POST',
    daysAgo: 6,
    body: `Our favourite anxious dragon is staying with us while Lady Grimsby attends a necromancers' convention. 🐉

**Please remember:**
- no swords, knives *or butter knives* in sight
- he likes being hummed to
- if he faints, he is fine — just wait

Madame Fangsworth came along "for moral support". Compliment her webs.`,
  },
  {
    title: 'Escaped slime: the official procedure',
    kind: 'PAGE',
    daysAgo: 120,
    body: `# 🟢 When a slime escapes

1. **Don't panic.** Slimes are slow. Mostly.
2. Check the usual places: kitchen, chapel, boots
3. Bring the slime solvent, a bucket and a *calm voice*
4. Open a ticket in the **Escape** category
5. Put the lid back on the Ooze Pit. **THE LID.**`,
  },
  {
    title: 'New: Therapy is in the app',
    kind: 'POST',
    daysAgo: 45,
    body: `Dr. Couchworth's therapy plans are now in the app! 🛋️

Therapists can log sessions with mood **before** and **after**, and we finally get a chart of how Mumbles is doing (spoiler: *better*).

Session notes are confidential, so only therapists and admins see them.`,
  },
  {
    title: 'Mumbles said "bridge" today',
    kind: 'POST',
    daysAgo: 3,
    body: `Big day in the Quiet Room: Mumbles said the word **bridge** out loud. Twice. 🌉

Please don't make a fuss when you see him. Maybe one small thumbs up. 👍`,
  },
  {
    title: 'Hydra head count: new rule',
    kind: 'POST',
    daysAgo: 30,
    body: `After *the incident* with Baron Vexmoor, we now count hydra heads at **check-in** AND **check-out**, and write the number on the intake form.

Hester has **five** heads: Agnes, Bertha, Clementine, Dot and Eunice. Eunice bites.`,
  },
  {
    title: 'Moat maintenance schedule',
    kind: 'PAGE',
    daysAgo: 100,
    body: `# 🌊 Moat maintenance

- **Mondays:** check the net between the North and South sections
- **Wednesdays:** skim the moat (not while the kraken is awake)
- **Fridays:** inspect drawbridge chains

The kraken *likes* the chains. That is the problem.`,
  },
  {
    title: 'Visiting hours change',
    kind: 'POST',
    daysAgo: 80,
    body: `From next month owners can visit **10:00–16:00**, not until dusk.

Reason: too many owners arriving in a dramatic thunderstorm at midnight. It upsets the gargoyles.`,
  },
  {
    title: 'The Leaky Grotto is still closed',
    kind: 'POST',
    daysAgo: 60,
    body: `The roof is *still* leaking. The ticket is *still* open. The Grotto stays **closed**.

If you have a contact who fixes enchanted stone roofs, please talk to the Castellan.`,
  },
  {
    title: 'Hiring Hall success stories',
    kind: 'POST',
    daysAgo: 90,
    body: `Three monsters found new lairs this season! 🏛️

- a griffin now guards a lighthouse
- an ogre runs a very quiet toll gate
- a goblin is "head of security" at a spoon museum (we have concerns)

Thank you to the front desk for all the paperwork. 🖋️`,
  },
  {
    title: 'Keeper onboarding checklist',
    kind: 'PAGE',
    daysAgo: 130,
    body: `# 🧹 New keeper checklist

- [ ] Collect your mirrored visor and earmuffs
- [ ] Read *Fire safety* and *How to feed a basilisk safely*
- [ ] Meet Old Hobb (bring biscuits)
- [ ] Learn the feeding schedule page
- [ ] Count the spoons in the Snug, and then count them again`,
  },
  {
    title: 'Werewolf moon calendar',
    kind: 'PAGE',
    daysAgo: 70,
    body: `# 🌕 Full moons

Werewolf residents move to the **Damp Cell** two days before a full moon.

Check the moon calendar in the supplies cupboard. If it is out of date, open a ticket — the last time we guessed, it went badly.`,
  },
  {
    title: 'Halloween at the castle',
    kind: 'POST',
    daysAgo: 4,
    body: `Thank you all for a wonderful Halloween! 🎃

Highlights:
- Whisper rearranged the Great Hall *twice*
- the banshee won the wailing contest (again)
- nobody lost a finger 🎉`,
  },
  {
    title: 'Reminder: count heads, not legs',
    kind: 'POST',
    daysAgo: 20,
    body: `Several intake forms list "legs: 8" for monsters that are not spiders. Please count **heads** for hydras and **legs** only when it matters.

Thank you. — the Front Desk`,
  },
  {
    title: 'Lair cleaning rota',
    kind: 'PAGE',
    daysAgo: 110,
    body: `# 🧽 Cleaning rota

| Day | Lairs |
| --- | --- |
| Monday | Ember Vault, Rookery |
| Tuesday | Dungeon (all) |
| Wednesday | East Wing |
| Thursday | Moat (from the bank!) |
| Friday | Cellar, Perch |

Bring your own mop. Do **not** borrow the ogre's.`,
  },
  {
    title: 'New potions supplier',
    kind: 'POST',
    daysAgo: 50,
    body: `We now buy potions from **The Apothecary of Bleakwater**. Their Restorative Draught is *excellent* and does not taste of feet.

Vets: please record prescriptions as usual.`,
  },
  {
    title: 'Draft: summer fete plans',
    kind: 'POST',
    daysAgo: 2,
    draft: true,
    body: `Ideas so far:

- monster petting corner (cuddly ones only, danger level 1)
- riddle stand run by the sphinx
- **no** arena. We all remember the riddle incident.`,
  },
  {
    title: 'Draft: new uniform policy',
    kind: 'PAGE',
    daysAgo: 1,
    draft: true,
    body: `Uniforms will be **fireproof** from next year. Sizes to the Castellan by the end of the month.`,
  },
]

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export async function seedBulletin(prisma: PrismaClient, world: World) {
  const scribe = world.users.scribe.id
  for (const e of ENTRIES) {
    const created = at(-e.daysAgo, 9, 30)
    await prisma.bulletinPage.create({
      data: {
        slug: slugify(e.title),
        title: e.title,
        bodyMd: e.body,
        kind: e.kind,
        status: e.draft ? 'DRAFT' : 'PUBLISHED',
        pinned: e.pinned ?? false,
        authorId: e.title.startsWith('Reminder') ? world.users.frontdesk.id : scribe,
        publishedAt: e.draft ? null : created,
        createdAt: created,
        revisions: { create: { title: e.title, bodyMd: e.body, editedById: scribe, editedAt: created } },
      },
    })
  }
  return ENTRIES.length
}
