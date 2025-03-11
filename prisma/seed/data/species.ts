// The Bandage Castle Species Compendium (seed edition). 📖
// [name, dangerLevel, dietType, diet, mealsPerDay, portionKg, tempMin, tempMax, humMin, humMax, darkness, lifespan, description]

type Row = [string, number, string, string, number, number, number, number, number, number, number, number | null, string]

export const SPECIES: Row[] = [
  ['Dragon', 5, 'CARNIVORE', 'Goats, sheep, the occasional knight\'s packed lunch', 2, 40, 30, 60, 10, 40, 70, 1000, 'Large, fire-breathing and sensitive about their hoard. Many suffer from adventurer-related anxiety.'],
  ['Wyvern', 4, 'CARNIVORE', 'Rabbits and fish', 3, 8, 15, 35, 20, 60, 30, 120, 'A dragon\'s smaller, two-legged cousin. Will not stop talking about it.'],
  ['Troll', 3, 'OMNIVORE', 'Turnips, goats and boiled boots', 2, 6, 5, 18, 60, 95, 80, 300, 'Lives under bridges. Many have complicated feelings about bridges.'],
  ['Ogre', 3, 'OMNIVORE', 'Stew. Any stew.', 3, 5, 10, 25, 40, 70, 50, 90, 'Big, slow and much gentler than the stories say. Snores.'],
  ['Goblin', 2, 'OMNIVORE', 'Leftovers, shiny things (not food, but they try)', 3, 0.8, 12, 26, 30, 70, 75, 40, 'Small, clever and light-fingered. Count the spoons.'],
  ['Hobgoblin', 2, 'OMNIVORE', 'Porridge and pickled onions', 3, 1.2, 12, 24, 30, 70, 60, 60, 'A goblin with a sense of order. Keeps lists.'],
  ['Kobold', 1, 'OMNIVORE', 'Mushrooms and candle stubs', 4, 0.4, 14, 28, 40, 80, 85, 30, 'Tiny tunnel-diggers. Terrified of everything, loyal to a fault.'],
  ['Basilisk', 5, 'CARNIVORE', 'Rats, served by someone wearing a mirror visor', 1, 3, 20, 35, 30, 60, 95, 200, 'Its gaze turns things to stone. Feed from behind a mirror. Never house near a cockatrice.'],
  ['Cockatrice', 4, 'OMNIVORE', 'Grain and beetles', 3, 0.5, 18, 30, 30, 60, 60, 25, 'Half rooster, half reptile, entirely bad-tempered. Petrifying touch.'],
  ['Hydra', 5, 'CARNIVORE', 'Fish, per head', 2, 12, 15, 28, 70, 100, 50, 500, 'Grows two heads for every one lost. Count heads at check-in AND check-out.'],
  ['Kraken', 5, 'CARNIVORE', 'Whole tuna, the occasional rowing boat', 1, 120, 2, 14, 100, 100, 90, null, 'Lives in the moat. Do not let it near the drawbridge chains.'],
  ['Minotaur', 4, 'HERBIVORE', 'Hay and apples', 3, 10, 8, 26, 30, 70, 40, 150, 'Excellent sense of direction, which is ironic given the labyrinths.'],
  ['Manticore', 5, 'CARNIVORE', 'Red meat', 2, 9, 20, 40, 10, 40, 40, 100, 'Lion body, scorpion tail, poet\'s soul. Recites verse when stressed.'],
  ['Chimera', 5, 'OMNIVORE', 'Three menus, one per head', 3, 7, 18, 38, 20, 50, 40, 80, 'Lion, goat and serpent heads that rarely agree on anything.'],
  ['Harpy', 3, 'CARNIVORE', 'Fish heads and gossip', 3, 1.5, 10, 25, 30, 60, 20, 70, 'Loud, nosy and excellent at finding lost things.'],
  ['Gorgon', 4, 'CARNIVORE', 'Mice (for the hair snakes) and soup (for the gorgon)', 3, 1, 22, 38, 20, 50, 70, 400, 'Snakes for hair, stone for gaze. Staff must wear mirrored goggles.'],
  ['Griffin', 3, 'CARNIVORE', 'Horse-sized portions of mutton', 2, 7, 5, 22, 20, 60, 20, 100, 'Proud and protective. Never seat next to a harpy.'],
  ['Golem', 2, 'MINERAL', 'Fresh clay and a polish on Sundays', 0, 0, -20, 50, 0, 100, 50, null, 'Does not eat. Does not sleep. Does enjoy being dusted.'],
  ['Wraith', 3, 'ETHEREAL', 'Moonlight and old regrets', 0, 0, -10, 15, 40, 90, 100, null, 'Mostly harmless. Mostly see-through. Hates the dinner bell.'],
  ['Banshee', 2, 'ETHEREAL', 'Moonlight', 0, 0, -5, 15, 50, 90, 95, null, 'Wails. Please provide earmuffs to neighbours.'],
  ['Ghoul', 3, 'CARNIVORE', 'Things best not discussed at dinner', 1, 2, 4, 14, 60, 90, 95, 200, 'Nocturnal, polite, and very particular about cutlery.'],
  ['Gargoyle', 2, 'MINERAL', 'Lichen and rainwater', 1, 0.5, -10, 30, 30, 100, 10, null, 'Turns to stone by day. Rooftop lairs only. Chips easily.'],
  ['Werewolf', 4, 'CARNIVORE', 'Steak, rare', 3, 3, 5, 22, 30, 70, 60, 80, 'Calm for 27 days of the month. Check the moon calendar.'],
  ['Slime', 1, 'OMNIVORE', 'Absolutely anything', 4, 2, 10, 30, 80, 100, 70, 15, 'Escapes through keyholes. Keep a mop handy.'],
  ['Giant Spider', 3, 'CARNIVORE', 'Crickets by the bucket', 2, 1.5, 15, 30, 50, 80, 90, 50, 'Spins beautiful webs and expects compliments on them.'],
  ['Cyclops', 4, 'OMNIVORE', 'Cheese and sheep, in that order', 3, 8, 10, 30, 30, 60, 30, 200, 'One eye, one big heart. Poor depth perception; mind the doorways.'],
  ['Sea Serpent', 4, 'CARNIVORE', 'Herring', 2, 25, 4, 18, 100, 100, 70, 400, 'Shares the moat with the kraken. Grudgingly.'],
  ['Sphinx', 3, 'CARNIVORE', 'Goat, served with a riddle', 2, 6, 25, 42, 10, 30, 30, 2000, 'Will not eat unless asked a riddle first. Keep a riddle book at the lair door.'],
  ['Imp', 1, 'OMNIVORE', 'Sugar, mostly', 5, 0.2, 18, 45, 20, 60, 50, 60, 'Tiny, mischievous and allergic to bedtime.'],
  ['Yeti', 3, 'HERBIVORE', 'Frozen berries and lichen', 3, 5, -30, 2, 30, 70, 20, 120, 'Needs the cold store. Gets homesick for avalanches.'],
]

// "Never house A next to B" — stored one way round, as entered by the vets over the years.
export const COMPATIBILITY_RULES: [string, string, string][] = [
  ['Basilisk', 'Cockatrice', 'Mutual petrification. Nobody wins.'],
  ['Gorgon', 'Basilisk', 'Too much staring. Everyone ends up as a statue.'],
  ['Griffin', 'Harpy', 'Ancient feud about a nest. Do not ask.'],
  ['Werewolf', 'Banshee', 'Howling contests until dawn.'],
  ['Kraken', 'Sea Serpent', 'Territorial about the moat. Separate sections only.'],
  ['Goblin', 'Dragon', 'Goblins steal from the hoard. Dragon notices. Fire.'],
  ['Manticore', 'Sphinx', 'Competitive riddling escalates to violence.'],
  ['Imp', 'Slime', 'Imps poke the slime. The slime absorbs the imps.'],
  ['Ghoul', 'Werewolf', 'Fights over leftovers.'],
  ['Chimera', 'Griffin', 'The goat head insults the griffin. Every time.'],
]
