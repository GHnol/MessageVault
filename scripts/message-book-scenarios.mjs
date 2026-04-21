/**
 * Deterministic seed data for Message Book Preview Handoff Package V1.
 * All scenarios are seeded — no real chat data required for canonical captures.
 * Data is pure JS: no Playwright dependency here.
 */

export const CONTACT_NAME = 'Alex';

// Fixed base timestamp so all captures are fully reproducible.
const BASE_MS = new Date('2024-06-01T09:00:00Z').getTime();

let _msgId = 0;
let _tsOffset = 0; // minutes from BASE_MS

function msg(sender, text, reactions = []) {
    _tsOffset += 4 + Math.floor(_msgId * 0.7) % 12; // deterministic spacing
    return {
        id:        `msg-${++_msgId}`,
        sender,
        text,
        timestamp: new Date(BASE_MS + _tsOffset * 60_000).toISOString(),
        reactions,
    };
}

function me(text, reactions)     { return msg('Me', text, reactions); }
function them(text, reactions)   { return msg(CONTACT_NAME, text, reactions); }

function group(id, customName, messages) {
    return { id, customName, messages, messageIndices: [], chosenTypeId: null, lastComposedAt: null };
}

// Reset ID counters between scenario builds so each scenario is independent.
function resetCounters() { _msgId = 0; _tsOffset = 0; }

/* ═══════════════════════════════════════════════════════════════════════════
   SCENARIO A — Short / Balanced Conversation
   Goal: Minimal clean book — title page, no dedication, 3 sections, ending.
   Nothing should span more than one page. All structural page types visible.
═══════════════════════════════════════════════════════════════════════════ */
export function buildScenarioA() {
    resetCounters();
    return {
        id:          'scenario-a-short-balanced',
        label:       'Scenario A — Short / Balanced',
        contactName: CONTACT_NAME,
        groups: [
            group('group-1', 'The Beginning', [
                them("Hey! Did you get the package I sent?"),
                me("Just got it today — the wrapping was beautiful"),
                them("So glad it arrived okay. Hope you like what's inside"),
                me("I love it. This is exactly what I was looking for, thank you"),
                them("Was hoping you'd say that"),
            ]),
            group('group-2', 'Making Plans', [
                me("Are we still on for Saturday?"),
                them("Yes! I was actually going to message you about that. Still works for me"),
                me("What time were you thinking?"),
                them("Maybe 2pm? We could grab lunch somewhere first"),
                me("Perfect. I know a great place near the park with outdoor seating"),
                them("Is that the one on Meridian?"),
                me("That's the one. They have the best coffee too"),
            ]),
            group('group-3', 'The Evening', [
                them("Tonight was really fun. Thanks for organizing everything"),
                me("Agreed. We should do it again soon"),
                them("Same time next month?"),
                me("Already putting it in the calendar"),
                them("Haha perfect. See you then"),
            ]),
        ],
        bookSettings: {
            title:            `Messages with ${CONTACT_NAME}`,
            dedicationEnabled: false,
            dedicationText:   '',
            timestampMode:    'on',
            pageNumberMode:   'on',
            dividerMode:      'sparse',
        },
        sectionConfig: [],
        captureSteps: [
            { label: 'default', description: 'All defaults — clean short book' },
        ],
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENARIO B — Dense Continuation Conversation
   Goal: Long sections that span multiple pages, forcing continuation markers
   on pages 2, 3, and 4+ of each section. Demonstrates the orphan guard and
   sender-run grouping under load.
═══════════════════════════════════════════════════════════════════════════ */
export function buildScenarioB() {
    resetCounters();

    // Long messages to push line counts high. Each is ~120–280 chars.
    const longConversation = [
        them("I've been thinking a lot about what you said last week and I think you were right. Sometimes you just have to let things go and trust that it'll work out."),
        me("That's exactly how I felt when I was going through something similar a few years ago. The uncertainty is the hardest part, but it does pass."),
        them("Did it take you a long time to get there? I feel like I keep going back and forth between being okay with it and then spiraling again."),
        me("Honestly yes. It wasn't a straight line at all. Some days were totally fine and then something small would set me off and I'd be back at square one."),
        them("That's reassuring in a strange way. At least I know I'm not doing it wrong."),
        me("You're not. You're just being a person. It's messy and nonlinear and that's completely normal."),
        them("I appreciate you saying that. I don't always feel like I can talk to people about this stuff without them trying to fix it or rush me past it."),
        me("Yeah I know what you mean. Sometimes you just need someone to sit with it rather than hand you a solution."),
        them("Exactly. Anyway — how are things on your end? I feel like I've been monopolizing the conversation lately."),
        me("Not at all. Things are okay. Work has been a lot but I'm managing. Got a project wrapping up this week which is a relief."),
        them("What's the project?"),
        me("Nothing glamorous — just a long overdue audit that turned into its own monster. But it's almost done and then I can breathe again."),
        them("That sounds exhausting. Are you at least sleeping okay?"),
        me("Better than last month. I was really struggling for a while there but I've been more disciplined about cutting off screens at night."),
        them("That actually helps a lot. I started doing the same thing about six weeks ago and noticed a real difference within like the first week."),
        me("Yeah I was skeptical but honestly even 30 minutes before bed without my phone makes a meaningful difference. I fall asleep faster."),
        them("Right? And the quality is better too, not just the speed. I feel more rested even on the same number of hours."),
        me("What finally got you to try it?"),
        them("I read something that said the issue isn't just the blue light, it's the psychological activation — your brain stays in 'response mode' because you're still looking at things that might require a reaction."),
        me("Oh that's interesting. So even passive scrolling counts because you're still in receive mode."),
        them("Exactly. Even reading the news. Anything that your brain is processing as potential input that needs a response."),
        me("That actually explains a lot. I always thought reading articles before bed was neutral but now I realize it's probably still keeping me activated."),
        them("Same. Now I do actual paper reading before bed. Old school but it works."),
        me("What are you reading right now?"),
        them("A biography I've been meaning to get to for two years. Finally making progress. It's slow going but in a good way — the kind of book that makes you stop and think every few pages."),
        me("I love those. What's it about?"),
        them("A photographer from the 1960s who documented entire communities over decades. The way she built trust with her subjects over years is extraordinary."),
        me("That sounds incredible. Long-form documentary work like that is so rare now. Everyone wants immediate output."),
        them("Exactly. She spent eight years on one project. You couldn't pitch that today."),
        me("Probably not. Though there are still some people doing that kind of slow work. Just harder to find and fund."),
        them("Have you been doing any photography lately?"),
        me("A little. I went out last Saturday morning and got some good stuff. Nothing serious — just the neighborhood early when no one's around yet."),
    ];

    const lateNight = [
        them("You still up?"),
        me("Yeah, can't sleep. What's going on?"),
        them("Nothing really. Just in that weird restless mood where I don't want to do anything but I also don't want to just lie there."),
        me("I know that feeling exactly. It's like your brain is running but it has nowhere to go."),
        them("That's exactly it. Have you eaten anything? I made too much soup and now I'm feeling guilty about it sitting in the fridge."),
        me("Ha — yes actually. I made pasta a couple hours ago. Are you still hungry?"),
        them("Not really. More just looking for something to do. Tell me about the pasta."),
        me("It was nothing special — just olive oil and garlic and some chili flakes with whatever vegetables I had. One of those meals that comes together in fifteen minutes and somehow tastes like you tried."),
        them("Those are the best kind. I've been in a cooking rut lately where everything I make feels like a chore."),
        me("What's your go-to when you don't want to cook?"),
        them("Honestly? Toast. I will eat toast at any hour and feel no shame about it."),
        me("Toast is deeply underrated. Good bread makes it completely different though."),
        them("Yes. The bread matters enormously. I splurged on a proper sourdough from that bakery on 5th and it changed my week."),
        me("Worth it though, right? There's a specific kind of pleasure in a well-made piece of toast with good butter."),
        them("Completely worth it. Simple pleasures. Speaking of which — did you end up watching that documentary?"),
        me("I did. Finished it last night. It was really good but also kind of heavy. I had to sit with it for a while."),
        them("Yeah, I felt the same way. The ending especially."),
        me("The ending wrecked me a little bit. In the best way."),
        them("Me too. It stayed with me all the next day. I kept finding myself thinking about it while doing completely unrelated things."),
        me("That's the mark of something that got in. Most things you watch and forget immediately."),
        them("Exactly. Okay I think I might be able to sleep now. Thanks for the company."),
        me("Anytime. This is what late nights are for."),
        them("Night :)"),
        me("Night"),
    ];

    return {
        id:          'scenario-b-dense-continuation',
        label:       'Scenario B — Dense Continuation',
        contactName: CONTACT_NAME,
        groups: [
            group('group-1', 'The Long Conversation', longConversation),
            group('group-2', 'Late Night Catch-Up',   lateNight),
        ],
        bookSettings: {
            title:            `A Long Exchange`,
            dedicationEnabled: false,
            dedicationText:   '',
            timestampMode:    'on',
            pageNumberMode:   'on',
            dividerMode:      'sparse',
        },
        sectionConfig: [],
        captureSteps: [
            { label: 'default', description: 'Dense book — continuation markers firing on 3+ pages' },
        ],
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENARIO C — Featured Moment Sequence
   Goal: One section marked Featured — starts on fresh page with distinct header
   treatment. Contrast between featured and non-featured sections is the key
   structural truth to capture.
═══════════════════════════════════════════════════════════════════════════ */
export function buildScenarioC() {
    resetCounters();
    return {
        id:          'scenario-c-featured-moment',
        label:       'Scenario C — Featured Moment',
        contactName: CONTACT_NAME,
        groups: [
            group('group-1', 'Before', [
                them("Morning — you all set for today?"),
                me("Almost. Just finishing up a few things"),
                them("No rush. See you when you get here"),
                me("Leaving in about 20 mins"),
                them("Perfect timing"),
            ]),
            group('group-2', 'That Day', [
                them("I can't believe we actually did it"),
                me("We really did. How do you feel?"),
                them("Honestly? Like everything's different and also exactly the same. Is that weird?"),
                me("Not at all. I think that's exactly how it's supposed to feel"),
                them("I keep looking at the photos and it still doesn't feel real"),
                me("It'll settle. Give it a few days"),
                them("Did you cry? I definitely cried"),
                me("I'm not answering that"),
                them("Haha okay that's an answer"),
                me("The ceremony was perfect though. Everything you wanted"),
                them("It really was. I'm so glad you were there for it"),
                me("Wouldn't have missed it. You know that"),
                them("I know. Thank you. Genuinely"),
                me("Stop it you're going to make me answer the crying question"),
                them("Ha. Fine. I love you"),
                me("Love you too"),
                them("Okay. Now go rest. You drove three hours to be here"),
                me("Worth every mile"),
            ]),
            group('group-3', 'The Week After', [
                me("How's the first week been?"),
                them("Surreal but good. We're still living off wedding food that people brought over"),
                me("As it should be. How long do you think it lasts?"),
                them("Realistically two more days. Then we have to be adults again"),
                me("The dream is over"),
                them("Ha. But honestly it's been lovely. Very quiet. Very us"),
                me("That's perfect"),
                them("It really is"),
                me("Can't wait to see the actual photos when they're ready"),
                them("Me too. Photographer said 6-8 weeks which feels like forever"),
            ]),
            group('group-4', 'Planning Ahead', [
                them("So — next summer?"),
                me("What are you thinking?"),
                them("Maybe a trip. Somewhere none of us have been"),
                me("I'm in. Give me options"),
                them("Working on it. More to come"),
            ]),
        ],
        bookSettings: {
            title:             `A Year with ${CONTACT_NAME}`,
            dedicationEnabled: true,
            dedicationText:    'For the moments that changed everything.\nYou know which ones they are.',
            timestampMode:     'on',
            pageNumberMode:    'on',
            dividerMode:       'sparse',
        },
        sectionConfig: [
            { sectionIndex: 1, featured: true },  // "That Day" — the featured moment
        ],
        captureSteps: [
            { label: 'default', description: 'Featured section visible — fresh page + distinct header' },
            {
                label: 'no-dedication',
                description: 'Dedication disabled — title page leads directly to content',
                overrides: { dedicationEnabled: false },
            },
        ],
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENARIO D — Multi-Section Book
   Goal: Full surface demo — 6 sections, custom titles, dedication, sparse vs
   none dividers, section reordering, Volume 2 split, section exclusion.
   Multiple capture steps show each sub-feature independently.
═══════════════════════════════════════════════════════════════════════════ */
export function buildScenarioD() {
    resetCounters();
    return {
        id:          'scenario-d-multi-section',
        label:       'Scenario D — Multi-Section Book',
        contactName: CONTACT_NAME,
        groups: [
            group('group-1', 'First Contact', [
                them("Hi — is this Alex's number?"),
                me("It is. Who's this?"),
                them("We actually met briefly at Jamie's thing last week. I'm the one who spilled the coffee"),
                me("Oh! Yes. I remember. No damage done"),
                them("Thank goodness. Anyway — Jamie gave me your number. Hope that's okay"),
                me("Completely fine. Nice to formally meet you"),
            ]),
            group('group-2', 'Getting to Know Each Other', [
                me("So what do you actually do? We didn't really get to talk properly"),
                them("Freelance illustration mostly. Some teaching. You?"),
                me("Product work. Very different world"),
                them("Completely different. Do you like it?"),
                me("Most of the time. Do you like yours?"),
                them("Most of the time. I think that's the honest answer for most people"),
                me("Probably. What do you illustrate?"),
                them("Kids books mostly. A few personal projects that are more abstract"),
                me("That sounds like a great split"),
                them("It keeps things interesting. The kids work pays the bills. The personal work keeps me sane"),
            ]),
            group('group-3', 'The First Real Conversation', [
                them("Okay I have to ask — what were you actually thinking when I knocked that coffee over"),
                me("Honestly? That you were going to be mortified and I should make it immediately not a big deal"),
                them("Ha. That was very kind of you. I was absolutely mortified"),
                me("I could tell. You went completely red"),
                them("Please stop"),
                me("It was endearing"),
                them("I'll allow that. What was the coffee even about? I was nervous"),
                me("About the party?"),
                them("About meeting people. I'm not great at it"),
                me("You seem great at it"),
                them("I'm faking it"),
                me("Then you're faking it very convincingly"),
                them("Years of practice"),
            ]),
            group('group-4', 'A Regular Week', [
                me("Good week or bad week?"),
                them("Medium week. The teaching was good. A deadline moved which is stressful"),
                me("Deadline for what?"),
                them("A new project. Can't say much yet but it's big for me"),
                me("That's exciting. Even if the timeline is stressful"),
                them("It is. What about your week?"),
                me("Honestly fine. Nothing notable. Which I've come to appreciate"),
                them("Boring weeks are underrated"),
                me("Completely"),
            ]),
            group('group-5', 'Something Small', [
                them("I drew something today that made me think of you"),
                me("Really? What was it?"),
                them("Just a small thing. A detail in a background. A specific color of door"),
                me("What color?"),
                them("That particular blue that's almost grey. The one that looks different depending on the light"),
                me("I know exactly the color you mean"),
                them("Of course you do"),
            ]),
            group('group-6', 'Looking Forward', [
                me("What are you hoping for this year?"),
                them("More work that surprises me. More conversations like this one"),
                me("That's a good answer"),
                them("What about you?"),
                me("Same, honestly. More of what matters less of what doesn't"),
                them("Very wise"),
                me("I stole it from somewhere"),
                them("Still counts"),
            ]),
        ],
        bookSettings: {
            title:             `Conversations with ${CONTACT_NAME}`,
            dedicationEnabled: true,
            dedicationText:    'Some conversations change things quietly.\nYou don\'t always know it at the time.',
            timestampMode:     'off',
            pageNumberMode:    'on',
            dividerMode:       'sparse',
        },
        sectionConfig: [
            { sectionIndex: 2, customTitle: 'How We Really Met' },
            { sectionIndex: 4, customTitle: 'A Particular Blue' },
        ],
        captureSteps: [
            {
                label:       'default',
                description: 'Full book — 6 sections, custom titles, dedication, sparse dividers',
            },
            {
                label:       'dividers-none',
                description: 'Dividers: None — contrast against sparse mode',
                overrides:   { dividerMode: 'none' },
            },
            {
                label:       'volume-split',
                description: 'Last 2 sections moved to Volume 2 — separate physical book in one order',
                volumeSplit: true,
                splitGroupIds: ['group-5', 'group-6'],
            },
            {
                label:       'section-excluded',
                description: '"A Regular Week" excluded — canvas skips that section cleanly',
                excludedGroupIds: ['group-4'],
            },
        ],
    };
}

export const ALL_SCENARIOS = {
    a: buildScenarioA,
    b: buildScenarioB,
    c: buildScenarioC,
    d: buildScenarioD,
};

export const ROUGH_AREA_FLAGS = [
    'Typography: system font stack (SF Pro / Segoe UI). Final print typeface not yet selected.',
    'Colors: all hex values are development placeholders — not the final print color system.',
    'Bubble styling: rounded corners and fills are screen-native. Print treatment not designed.',
    'Emoji: renders as OS-native (Apple Color Emoji on macOS). Print-safe set not yet applied.',
    'Page margins: CSS approximations — do not reflect physical 7×10" trim/bleed/safe-area spec.',
    'Page number placement: simple centered. Final recto/verso-aware outside-margin placement not implemented.',
    'Continuation marker: "Name — cont\'d" treatment is directional placeholder only.',
    'Featured header: larger/centered/rule is compositional signal — visual treatment is not final.',
    'Ending page: brand/tagline layout is placeholder. Final ending page design not produced.',
    'Dark mode: canvas dark mode is development convenience only. Print product is light-mode.',
    'Page gaps in canvas: scroll-view artifact. No page gaps exist in the physical print file.',
];
