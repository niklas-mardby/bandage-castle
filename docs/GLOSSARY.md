# 📚 Bandage Castle Glossary

New to the castle? Here's what everyone is talking about. 🧙

| Term | Meaning |
| --- | --- |
| 🏰 **Bandage Castle** | A care facility for monsters, run out of an old castle. Our customers are villains. Be polite. |
| 🧌 **Monster** | An individual creature in our care, e.g. *Sir Snortlewick* the dragon. Stored in `tbl_monster`. |
| 📖 **Species** | The kind of monster (dragon, troll, basilisk...). Holds diet, danger level and habitat needs. |
| 🦹 **Owner** | A customer who owns a monster and brings it to us. Role `OWNER`. |
| 👑 **Overlord** | A customer who wants to hire a monster through the Hiring Hall. Role `OVERLORD`. One person can be both. |
| 🛏️ **Stay** | One visit of a monster at the castle, from booking to check-out. Has a *reason*. |
| 🏖️ **Boarding** | Reason: "look after my wyvern while I'm on holiday". |
| 🩹 **Treatment** | Reason: the monster was injured (usually by adventurers) and needs patching up. |
| 🛋️ **Therapy** | Reason: the monster is afraid of adventurers, torchlight, bridges... |
| 🦴 **Surrender** | Reason: the owner gives the monster up for good. It stays with us until it is hired. |
| 🚪 **Intake** | The admission form filled in at the gate: condition on arrival, weight, injuries, belongings. Checking in a stay. |
| 📅 **Expected pickup** | The date the owner promised to come back. Coming later costs a late pickup fee. |
| ⏳ **Extension** | Moving the expected pickup date later, with a reason. |
| 🏚️ **Lair** | An enclosure with a capacity and habitat settings (temperature, humidity, darkness). |
| ⚠️ **Compatibility rule** | "Never house species A next to species B", e.g. basilisk and cockatrice. |
| 🍖 **Feeding schedule** | The daily list of who eats what and when, generated from species and lair data. |
| 🏛️ **Hiring Hall** | The marketplace where overlords browse monsters available for hire. |
| 📋 **Listing** | A monster advertised in the Hiring Hall, with a fee and an available-from date. |
| 📜 **Application** | An overlord's request to hire a listed monster, with references. |
| 🖋️ **Hire contract** | The signed agreement once an application is accepted. Has a reference like `HH-7KQ2`. |
| 📨 **Booking request** | An owner asking for a stay through the app. The front desk approves it (which creates the stay) or declines it. |
| 👋 **Visit** | An owner coming to see their monster during visiting hours. Booked in half-hour slots. |
| 📔 **Diary** | The owner's view of one monster: current stay, lair, meals, health summary. |
| 🪙 **Copper piece (cp)** | 1/100 of a gold piece. Billing v2 stores all money as whole copper pieces (ADR-006). |
| 🚩 **Feature flag** | A switch in the database that turns a feature on or off, e.g. ENABLE_BILLING_V2. |
| 🎫 **Ticket** | An internal task: broken portcullis, escaped slime, lair cleaning. |
| 🐦 **Raven Post** | How we notify customers. Old, beloved, slightly unreliable. |
| 🪙 **Gold piece (gp)** | The castle's currency. Prices are in gold. |
