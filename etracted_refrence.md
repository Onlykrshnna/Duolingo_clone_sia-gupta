# Lingo: Duolingo Clone Reference Specification

This document provides a conceptual reference for a language learning platform inspired by Duolingo. It details the page structures, layouts, UI components, design tokens, features, data models, and micro-interactions of the clone to serve as an independent blueprint for developing a separate project in a different tech stack.

---

## 1. Page & Route Structure

### Landing / Marketing Page (`/`)
*   **Purpose:** The entry point for non-authenticated and newly arriving visitors.
*   **Visual Elements:** Displays a large center-aligned hero graphic alongside a branding tagline. Features a header containing the application logo/title and login options.
*   **Data Dependencies:** User authentication state (to toggle actions).
*   **Authentication States:**
    *   *Signed Out:* Displays "Get Started" (leads to registration) and "I already have an account" (leads to sign-in). Shows a decorative footer displaying active flags of supported languages as unclickable icons.
    *   *Signed In:* Replaces call-to-actions with a single "Continue Learning" button leading straight to the path page.
*   **Navigation:** Navigates *in* via the root domain. Navigates *out* to the main path page (`/learn`) once authenticated.

### Learning Path Page (`/learn`)
*   **Purpose:** The primary dashboard and path progression feed for authenticated users.
*   **Visual Elements:** Left-aligned vertical path representing units. Each unit displays a header banner with unit level information and a sinuous sequence of lesson buttons (nodes). The right rail contains floating widgets (active course flag, point counts, heart meter, subscription promotional card, and current quests summary).
*   **Data Dependencies:**
    *   User progress (active course, points, remaining hearts).
    *   Unit details (title, description, sequence order).
    *   Course progress (active lesson identifier).
    *   Active lesson completion percentage.
    *   Active subscription status (to toggle unlimited hearts and ads/promos).
*   **Navigation:** Navigates *in* via the sidebar or root redirect. Navigates *out* to the active lesson player (`/lesson`), course selector (`/courses`), store (`/shop`), or other sidebar views.

### Language Courses Selection Page (`/courses`)
*   **Purpose:** Allows users to choose which language course they are actively studying.
*   **Visual Elements:** Grid list of selectable flags representing languages (e.g. Spanish, French, Italian, Japanese). The active language card displays a checkmark indicator.
*   **Data Dependencies:** Complete list of available course entities and the user's active course ID.
*   **Navigation:** Entered via clicking the flag button in the user progress stats header or selecting "Courses". Exited by selecting a language card (which updates the database and redirects to `/learn`) or selecting back.

### Leaderboard Page (`/leaderboard`)
*   **Purpose:** Weekly or community ranking of users based on total earned XP points.
*   **Visual Elements:** Ranked list of the top ten users. Displays rank number (1-10), user profile avatar, username, and total XP score. The layout retains the same sidebar and right-rail widgets as `/learn`.
*   **Data Dependencies:** Top ten user progress profiles sorted descending by XP points.
*   **Navigation:** Navigates *in* via the left sidebar. Navigates *out* via other sidebar options.

### Quests Page (`/quests`)
*   **Purpose:** Lists target achievements for earning points and visualizes progress.
*   **Visual Elements:** Lists XP-based milestones (e.g., "Earn 50 XP") with points icons and horizontal progress bars showing how close the user is to completion. Retains the standard sidebar and right rail.
*   **Data Dependencies:** Current user's points tally and static list of milestones.
*   **Navigation:** Entered from the sidebar or clicking "View all" in the right-rail quests card. Exited via sidebar navigation.

### Shop Page (`/shop`)
*   **Purpose:** Points shop to replenish gameplay items or upgrade account levels.
*   **Visual Elements:** Offers two purchasing cards:
    1.  *Refill Hearts:* Spend 10 points to restore hearts to full. Displays "full" if already at maximum. Disabled if points are insufficient.
    2.  *Unlimited Hearts:* Upgrade to "Lingo Pro" (monthly recurring subscription checkout). Displays "settings" and redirects to stripe portal if already subscribed.
*   **Data Dependencies:** User progress details (current points and hearts) and user subscription status.
*   **Navigation:** Entered from the sidebar or clicking point/heart meters in the header. Exited via sidebar.

### Lesson Player Page (`/lesson` & `/lesson/[lessonId]`)
*   **Purpose:** The focus-mode game screen for playing quizzes.
*   **Visual Elements:**
    *   *Header:* A progress bar showing percent completion, an 'X' button to exit, and a heart meter (showing current hearts count or an infinity icon).
    *   *Body:* Displays the prompt/question. For mascot assist questions, shows a speech bubble. Below, a grid of multiple choice options is shown.
    *   *Footer:* High-contrast action panel. When unchecked, displays a disabled "Check" button. When checked, turns light green (for correct answer) showing "Nicely done! / Next" or light red (for wrong answer) showing "Try again. / Retry".
*   **Data Dependencies:** Complete list of challenges for the lesson, challenge options, user progress (hearts), and subscription status.
*   **Navigation:** Entered via clicking a lesson button on the path. Exited by clicking 'X' (triggers exit confirmation modal) or completing the lesson (triggers congratulations screen and redirects to `/learn`).

---

## 2. Layout Pattern

### Desktop Layout
*   **Sidebar Navigation:** Anchored fixed on the left (`width: 256px`), taking full viewport height. Separated from content by a thin border.
*   **Main Container:** Left-padded by `256px` to clear the sidebar. Centered with a maximum width constraint of `1056px`.
*   **Multi-Column Views:** Pages like `/learn`, `/leaderboard`, `/quests`, and `/shop` utilize a horizontal flex structure with a `48px` gap, ordered in reverse:
    *   *Right Rail:* A sticky sidebar (`width: 368px`, offset `top: 24px`) displaying stats headers, pro promotions, and quest cards.
    *   *Center Feed:* Flex-grow main container displaying units path, rankings, shop lists, or quests.

### Mobile Layout Breakpoints
*   **Sidebar Collapse:** Hidden on viewports below desktop scale (`hidden lg:flex`).
*   **Mobile Top Bar:** A green navigation bar (`height: 50px`) fixed to the top of the viewport. Features a hamburger menu button.
*   **Drawer Navigation:** Clicking the hamburger menu triggers a full-height drawer (`Sheet` overlay) sliding out from the left (`z-index: 100`), containing the exact desktop navigation sidebar.
*   **Padding Adjustments:** The main container removes left padding and adds top padding (`50px`) to push content below the fixed mobile bar.
*   **Right Rail Hiding:** The sticky right rail widget is completely hidden (`hidden lg:block`).

---

## 3. Component Inventory

### Sidebar
*   **Appearance:** Fixed left container, border-r, padding, white background. Contains mascot logo at top, navigation links in center, and account avatar at bottom.
*   **Branding Header:** Binds a Mascot svg (40x40px) with the bold brand name "Lingo" styled in green.

### SidebarItem
*   **Appearance:** Full-width block navigation link containing a 32x32px icon and bold uppercase text.
*   **States & Transitions:**
    *   *Active:* Sky-blue background opacity tint (`sky-500/15`), sky-blue border (`border-sky-300`), sky-blue text color.
    *   *Inactive:* Transparent background, slate gray text. Hover changes background to light gray (`bg-slate-100`).

### UserProgress (Stats Header)
*   **Appearance:** Multi-icon row showing progress metrics:
    1.  *Course Flag:* Rounded-md border flag representing the language course. Links to `/courses`.
    2.  *Points count:* Yellow-orange gem points icon next to the number text (orange color). Links to `/shop`.
    3.  *Hearts count:* Red heart icon next to the number of hearts (rose color) or an Infinity icon if the user is a Pro subscriber. Links to `/shop`.
*   **Interactions:** Hovering over metrics triggers standard background transitions (ghost button style).

### Promo Card
*   **Appearance:** Rectangular card, rounded-xl border, padded. Contains a purple lightningbolt/infinity icon, heading "Upgrade to Pro", descriptive subtext, and a full-width solid indigo button ("super" button variant).

### Quests Card
*   **Appearance:** Rectangular card, rounded-xl border. Contains a header row ("Quests" title + small Outline button "View all") and a list of quests. Each quest row shows a 40x40px points gem icon, the quest description, and a thin visual progress bar.

### UnitBanner
*   **Appearance:** Rectangular header block spanning the width of the main feed. Solid green background (`bg-green-500`), rounded corners, padded. Displays Unit title and descriptive subtitle in bold white text. Contains a "Continue" button with a notebook icon on large screens.

### LessonButton (Skill Node)
*   **Appearance:** Circular button (70x70px) positioned on the path feed.
*   **Sinuous Offset Logic:** Horizontal positioning mimics a sinuous snake path based on lesson indices. Using a cycle length of 8:
    *   Indentation Level: `[0, 1, 2, 1, 0, -1, -2, -1]`
    *   Offset formula: `indentationLevel * 40px` (applied as CSS `right` property).
*   **Visual States:**
    *   *Locked:* Gray background (`bg-neutral-200`), dark gray border-b-8, gray star icon. Click disabled.
    *   *Completed:* Green background (`bg-green-500`), green border-b-8, white check icon. Clicking launches specific lesson player for practice.
    *   *Active (Current):* Embedded in a green circular progress ring reflecting active completion percentage. Displays a bouncing white speech bubble on top displaying "START" in bold green uppercase text. Clicking launches lesson player.

### ExitModal
*   **Appearance:** Centered warning dialog. Displays a sad mascot graphic, bold heading "Wait, don't go!", warning text, a solid green button ("Keep learning"), and a danger outline button ("End session").

### HeartsModal
*   **Appearance:** Centered warning dialog triggered on zero hearts. Displays a crying/sad mascot icon, warning title "You ran out of hearts!", subtext suggesting Pro upgrade or Shop purchase, a solid green button ("Get unlimited hearts"), and an outline button ("No thanks").

### PracticeModal
*   **Appearance:** Information dialog. Displays a heart graphic, title "Practice lesson", descriptive subtext explaining that practice lessons do not risk hearts, and a solid green button ("I understand").

### QuestionBubble
*   **Appearance:** Prompt box. Renders a mascot avatar on the left (60x60px desktop, 40x40px mobile). On the right, a rounded-xl text bubble containing the question text. Features an absolute-positioned left-aligned triangle mimicking a speech bubble pointer.

### Card (Option Card)
*   **Appearance:** Multiple choice card. Features a 3D pressed tactile style (`border-2 border-b-4 rounded-xl active:border-b-2`). Contains option text, optional illustration image in a square frame, and a cornered shortcut bubble showing the key number (e.g. `1`, `2`, `3`).
*   **States & Colors:**
    *   *Default:* White background, slate gray borders, gray text, gray shortcut bubble.
    *   *Selected:* Light blue background (`bg-sky-100`), blue border (`border-sky-300`), blue text, blue shortcut bubble.
    *   *Correct (on check):* Light green background (`bg-green-100`), green border (`border-green-300`), green text, green shortcut bubble.
    *   *Wrong (on check):* Light red background (`bg-rose-100`), red border (`border-rose-300`), red text, red shortcut bubble.
*   **Interactions:** Hovering highlights background. Clicking plays the associated audio pronunciation.

### ResultCard
*   **Appearance:** Completion metrics widget. Contains a top colored header bar showing uppercase card titles ("Total XP" or "Hears Left" - *Note: reference app features a spelling typo "Hears" instead of "Hearts"*) and a white body showing the icon (gem or heart) and points count/infinity symbol colored to match the theme.
    *   *XP variant:* Orange header (`bg-orange-400`), orange text in body.
    *   *Hearts variant:* Rose header (`bg-rose-500`), rose text in body.

---

## 4. Design Tokens

### Color Palette
*   **Brand Green (Primary):** `#22C55E` (Tailwind `green-500`). Border: `#16A34A` (Tailwind `green-600`). Used for main logos, correct answer banners, correct options, active lesson nodes, progress bars, and positive check buttons.
*   **Sky Blue (Primary Actions / Selected):** `#38BDF8` (Tailwind `sky-400`). Border: `#0EA5E9` (Tailwind `sky-500`). Used for active navigation outlines, selected multiple-choice states, and primary page layouts.
*   **Rose Red (Hearts / Danger / Errors):** `#F43F5E` (Tailwind `rose-500`). Border: `#E11D48` (Tailwind `rose-600`). Used for hearts icons, hearts meters, wrong option selections, error banners, and quit buttons.
*   **Orange (XP / Points):** `#FB923C` (Tailwind `orange-400`). Used for XP counts, points gem icons, and the points completion card.
*   **Indigo (Super / Pro):** `#6366F1` (Tailwind `indigo-500`). Border: `#4F46E5` (Tailwind `indigo-600`). Used for "Lingo Pro" banners, premium buttons, and promotion cards.
*   **Slate / Gray (Muted / Borders):** Muted Text: `#475569` (slate-600). Light Border: `#E2E8F0` (slate-200). Muted Base: `#94A3B8` (slate-400).
*   **Locked Gray (Locked States):** Neutral Background: `#E5E5E5` (neutral-200). Neutral Border: `#A3A3A3` (neutral-400).

### Typography
*   **Font Family:** **Nunito** (Google Fonts rounded sans-serif). Applied globally to body, menus, and controls to maintain a soft, friendly, cartoonish visual feel.
*   **Weights:** Bold (`font-bold`, weight 700) for controls/options, Extrabold (`font-extrabold`, weight 800) for headers/titles, Medium/Normal for descriptions.

### Border Radius
*   **Buttons, Option Cards, Unit Banners, Modals:** `rounded-xl` (12px / 0.75rem).
*   **Result Cards:** `rounded-2xl` (16px / 1rem).
*   **Check Boxes / Shortcut Bubbles:** `rounded-md` (6px / 0.375rem).
*   **Circular Buttons:** `rounded-full`.

### Pressed 3D Tactile Effect
*   **Mechanism:** Buttons and cards achieve a 3D cartoon button style using layered bottom borders.
*   **Default State:** `border-2 border-b-4` (a 2px border around the element, with the bottom border expanded to 4px using a darker color value).
*   **Active Pressed State:** `active:border-b-2` or `active:border-b-0`. On mouse/touch click, the bottom border shrinks, visually shifting the inner container downward, simulating a physical mechanical key depression.

---

## 5. Core Gameplay & Feature Specs

### Lesson Gameplay Loop
*   A lesson consists of a sequential list of challenges.
*   **Initial Setup:** Load the remaining challenges. Set the starting progress bar percentage based on already completed challenges.
*   **Validation Flow:**
    1.  User selects a card. Card plays its pronunciation audio. The "Check" button in the footer becomes active.
    2.  User clicks "Check" or presses `Enter`.
    3.  If **correct**: Plays `/correct.wav`. The footer turns light green, showing a checkmark and success message. Option card turns green. The progress bar increases.
    4.  If **incorrect**: Plays `/incorrect.wav`. The footer turns light red, showing an 'X' icon and error message. Option card turns red. User's hearts count is decremented by 1 (unless Pro subscriber or in practice mode).
    5.  User clicks "Next"/"Retry" or presses `Enter`.
    6.  If correct, the index increments to the next challenge. If incorrect, the current challenge is reset (selections cleared, status reset to default) and the user must try the **same** challenge again.
*   **Hearts depletion:** If hearts hit 0 during a lesson (and user is not Pro / not practicing), the Hearts modal is shown, blocking progress. Clicking out redirects the user to the shop.
*   **Completion Screen:** Triggered when `activeIndex` exceeds the challenges list. Plays `/finish.mp3`, launches falling confetti, and lists stats cards showing total XP earned (+10 XP per challenge) and remaining hearts. Clicking "Continue" returns the user to `/learn`.

### Streak Logic
*   **Verification:** The database models and actions do *not* contain properties or code for tracking consecutive daily streaks. Progress is tracked strictly via points (XP) and challenge completion history.

### Hearts Regeneration
*   Maximum hearts limit is 5.
*   **Shop Refill:** Refills hearts to full (5) instantly. Costs 10 points.
*   **Practice Mode:** Completing challenges in practice mode (lessons already completed previously) restores 1 heart per completed challenge up to the maximum of 5, without the risk of losing hearts on mistakes.
*   **Pro Subscription:** Activates unlimited hearts, replacing the heart count with an Infinity symbol.

### Quests
*   Static milestone goals (20 XP, 50 XP, 100 XP, 250 XP, 500 XP, 1000 XP).
*   Progress is calculated dynamically: `(user_points / milestone_value) * 100`.
*   Rendered as horizontal bar meters in the right rail widget and full lists page.

### Leaderboard / Leagues
*   Retrieves all user profiles in the database, ranks them descending by total XP, and displays the top 10.
*   Leaderboard lists rank position (1-10), user avatar, name, and total points.

### Practice Mode
*   Triggered when starting a lesson that is already marked as 100% completed.
*   Displays a "Practice lesson" popup warning on startup.
*   Users do not lose hearts for incorrect answers. Correct answers add +1 heart (up to 5) and award +10 points (gems).

### Shop & Points (Gems)
*   **Points (XP/Gems):** Earned by completing normal lessons (+10 points per challenge) or practicing completed lessons (+10 points).
*   Spent in the shop to buy Refill Hearts (costs 10 points).
*   **Stripe Integration:** Upgrade option redirects the user to Stripe Checkout to buy Lingo Pro ($20.00 USD/month recurring). If already subscribed, the button redirects to the Stripe customer billing portal to manage/cancel subscriptions.

---

## 6. Database Concepts (Conceptual Model)

```mermaid
erDiagram
    COURSES ||--o{ UNITS : "has units"
    COURSES ||--o{ USER_PROGRESS : "active course"
    UNITS ||--o{ LESSONS : "has lessons"
    LESSONS ||--o{ CHALLENGES : "has challenges"
    CHALLENGES ||--o{ CHALLENGE_OPTIONS : "has options"
    CHALLENGES ||--o{ CHALLENGE_PROGRESS : "tracks completion"
    
    USER_PROGRESS {
        string userId PK
        string userName
        string userImageSrc
        int activeCourseId FK
        int hearts
        int points
    }
    
    COURSES {
        int id PK
        string title
        string imageSrc
    }
    
    UNITS {
        int id PK
        string title
        string description
        int courseId FK
        int order
    }
    
    LESSONS {
        int id PK
        string title
        int unitId FK
        int order
    }
    
    CHALLENGES {
        int id PK
        int lessonId FK
        enum type
        string question
        int order
    }
    
    CHALLENGE_OPTIONS {
        int id PK
        int challengeId FK
        string text
        boolean correct
        string imageSrc
        string audioSrc
    }
    
    CHALLENGE_PROGRESS {
        int id PK
        string userId
        int challengeId FK
        boolean completed
    }
    
    USER_SUBSCRIPTION {
        int id PK
        string userId UNIQUE
        string stripeCustomerId UNIQUE
        string stripeSubscriptionId UNIQUE
        string stripePriceId
        timestamp stripeCurrentPeriodEnd
    }
```

### Entities Description
*   **Course:** A language track (e.g. Spanish, French). Contains a title and flag asset URL.
*   **Unit:** Chapters grouping lessons together (e.g. Unit 1: "Basics"). Belongs to a course and has an ordering parameter.
*   **Lesson:** Group of quiz challenges. Belongs to a unit, has a title and order.
*   **Challenge:** Individual question nodes (e.g., SELECT or ASSIST). Belongs to a lesson, has a prompt text and order.
*   **Challenge Option:** Multiple-choice answers. Belongs to a challenge, contains option text, a boolean correctness indicator, optional card illustrations, and optional audio pronunciations.
*   **Challenge Progress:** Completion logs mapping users to completed challenges.
*   **User Progress:** User profile statistics tracking username, avatar, active course, current hearts count, and total accumulated points.
*   **User Subscription:** Records premium status, linking users to customer/billing details and subscription expiration timestamps.

---

## 7. Animation & Interaction Notes

### Lesson Button Bouncing Bubble
*   The active lesson node features a bouncing white speech bubble showing "START".
*   **Animation:** Standard vertical translation offset (bounce keyframe) loop, attracting focus.

### Confetti Celebration
*   Triggered immediately upon lesson completion (no challenges remaining).
*   **Behavior:** Emits 500 multicolored paper particles falling down from the top edge, settling and fading over 10 seconds. The animation is non-recycling (stops emitting once particles clear).

### Keyboard Shortcuts
*   **Multiple-Choice Selection:** Users can select options by pressing keyboard keys `1`, `2`, `3` etc., corresponding to card numbers. Selection triggers card audio play.
*   **Gameplay Submission:** Pressing the `Enter` key automatically triggers checking answers, moving to the next challenge, or exiting the final screen.

### Sound Effects
*   `/correct.wav`: High-pitch chime triggered upon checking a correct answer.
*   `/incorrect.wav`: Buzz sound triggered upon checking an incorrect answer.
*   `/finish.mp3`: Triumphant trumpet fanfare triggered on final completion screen.

### Tactile Button Compression
*   Clicking buttons changes bottom borders from `border-b-4` to `active:border-b-2` or `active:border-b-0`, visually compressing the component downward to mimic mechanical button presses.

---

## 8. Visual Reference Index (Screenshots)

*   **`img_main.png`**
    *   *Path:* `.github/images/img_main.png`
    *   *Description:* Displays the main landing/marketing page view, highlighting the header, center-aligned hero mascot graphic, and call-to-action cards.
*   **`img1.png`**
    *   *Path:* `.github/images/img1.png`
    *   *Description:* Displays the core learning path layout. Visualizes unit banners, circular lesson path buttons offset in a sinuous curve, stats panels, right rail widgets, and the left-aligned desktop sidebar.
*   **`img2.png`**
    *   *Path:* `.github/images/img2.png`
    *   *Description:* Displays the Quests interface, showing the progress cards and milestone progress bars.
*   **`img3.png`**
    *   *Path:* `.github/images/img3.png`
    *   *Description:* Displays the Shop interface, showing the cards for buying heart refills with gems and upgrading to Pro.
*   **`stats.svg`**
    *   *Path:* `.github/images/stats.svg`
    *   *Description:* Performance speed rating indicator vector graphic.
