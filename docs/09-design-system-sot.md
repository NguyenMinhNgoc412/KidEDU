---
name: Gentle Growth
colors:
  surface: "#fdfae8"
  surface-dim: "#dddac9"
  surface-bright: "#fdfae8"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f7f4e2"
  surface-container: "#f1eedd"
  surface-container-high: "#ebe9d7"
  surface-container-highest: "#e6e3d2"
  on-surface: "#1c1c12"
  on-surface-variant: "#45483f"
  inverse-surface: "#313125"
  inverse-on-surface: "#f4f1df"
  outline: "#75786e"
  outline-variant: "#c5c8bc"
  surface-tint: "#536441"
  primary: "#50613f"
  on-primary: "#ffffff"
  primary-container: "#697a56"
  on-primary-container: "#f9ffeb"
  inverse-primary: "#bacda3"
  secondary: "#7d562d"
  on-secondary: "#ffffff"
  secondary-container: "#ffca98"
  on-secondary-container: "#7a532a"
  tertiary: "#5a5e43"
  on-tertiary: "#ffffff"
  tertiary-container: "#73775a"
  on-tertiary-container: "#fcffe0"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d6e9bd"
  primary-fixed-dim: "#bacda3"
  on-primary-fixed: "#111f05"
  on-primary-fixed-variant: "#3c4c2b"
  secondary-fixed: "#ffdcbd"
  secondary-fixed-dim: "#f0bd8b"
  on-secondary-fixed: "#2c1600"
  on-secondary-fixed-variant: "#623f18"
  tertiary-fixed: "#e1e6c2"
  tertiary-fixed-dim: "#c5c9a7"
  on-tertiary-fixed: "#1a1d07"
  on-tertiary-fixed-variant: "#45492f"
  background: "#fdfae8"
  on-background: "#1c1c12"
  surface-variant: "#e6e3d2"
  soft-cream: "#FAEDCD"
  warm-terracotta: "#BC6C25"
  sage-green: "#A3B18A"
  muted-stone: "#606C38"
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: "700"
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 38px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: "600"
    lineHeight: 34px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 30px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 22px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 18px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 24px
  container-padding-desktop: 64px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is centered on **Gentle Minimalism** with a **Tactile** influence. The primary goal is to provide a sensory-safe environment for children with speech delays while offering a clear, professional management suite for parents.

The aesthetic is characterized by:

- **Low Cognitive Load:** Removing all non-essential decorative elements to ensure the child focuses entirely on the visual of the mouth (articulation) and the accompanying image.
- **Warmth & Safety:** Utilizing soft, organic curves and a muted, earthy palette to evoke a sense of home and comfort rather than a clinical or high-energy gaming environment.
- **Haptic Trust:** UI elements use subtle depth and large hit targets to accommodate developing motor skills and reduce frustration.
- **Narrative Distinction:** The "Child Mode" is immersive and focused, while the "Parent Zone" is structured and administrative, yet they share the same calming visual DNA.

## Colors

The palette avoids "vibrating" or high-saturation colors that could trigger sensory overload.

- **Primary (Sage):** Used for progress indicators and success states. It represents growth and calm.
- **Secondary (Terracotta):** Reserved for interactive elements that require attention but remain warm.
- **Neutral (Warm Cream/Beige):** This is the foundation of the UI, replacing harsh whites to reduce screen glare and eye strain.
- **Named Colors:** These earth-toned variations are used to distinguish different categories (e.g., "Family" vs. "Actions") without resorting to aggressive primary colors.

## Typography

**Plus Jakarta Sans** is the sole typeface for this design system. Its soft, rounded terminals and modern geometric construction make it highly legible for children and friendly for parents.

- **Scale:** Sizes are intentionally larger than standard SaaS applications to ensure accessibility and clear word recognition.
- **Legibility:** Generous line heights prevent text crowding, which is essential for parents managing data and children seeing word labels.
- **Case:** Use Title Case for labels and Sentence case for instructions. Avoid All-Caps to maintain an approachable tone, except the single target word/phrase in Child study and Auto Play screens may use uppercase to increase word focus and match the study-screen reference.

## Layout & Spacing

The design system utilizes a **Fluid Grid** with significant "Safe Zones" to prevent accidental taps.

- **Rhythm:** A strict 8px baseline grid ensures vertical harmony.
- **Margins:** Large 24px margins on mobile ensure children's hands don't obscure content or trigger navigation by accident.
- **Child Mode Layout:** Centered, singular focus. Only one card or one video is visible at a time to eliminate choice paralysis.
- **Parent Zone Layout:** Standard 12-column grid on desktop, reflowing to a single column list on mobile.
- **Reflow:** On tablets, the "Articulation Video" and "Object Image" should sit side-by-side; on mobile, they stack vertically to maximize the size of the mouth view.

## Elevation & Depth

This design system avoids harsh dropshadows in favor of **Tonal Layers** and **Soft Ambient Occlusion**.

- **Surface Levels:**
  - Level 0: `neutral_color_hex` (The background).
  - Level 1: `soft-cream` (Cards and containers).
- **Shadows:** Use extremely soft, tinted shadows (`sage-green` at 10% opacity) for interactive elements like buttons. This creates a "squishy," tactile feel rather than a floating digital effect.
- **Parent Gate:** Uses a full-screen backdrop blur (20px) to clearly separate the child's environment from the management settings.

## Shapes

The shape language is extremely rounded to communicate safety and friendliness.

- **Components:** All buttons, cards, and input fields use a minimum radius of 24px (`rounded-xl`).
- **Media Containers:** Images and videos must be clipped to the same 24px radius to maintain a consistent "Learning Card" look.
- **Iconography:** Use "Super-rounded" or "Duo-tone" icons with thick strokes (2px minimum) to match the weight of the typography.

## Components

### Buttons

- **Primary Action:** Large (minimum 56px height), pill-shaped, using `secondary_color_hex` with white text. High contrast for legibility.
- **Child Play/Next:** Oversized circular buttons (80px+) with simple icons (Play, Arrow).

### Cards

- **Learning Card:** Uses `soft-cream` background. The image occupies the top 60%, with the text label in `headline-lg` at the bottom.
- **Status Indicators:**
  - **Child Word List:** Completed items are marked with a soft yellow `star` icon. No text status.
  - **Parent Word List:** Status is displayed as text labels (e.g., "Mới", "Đang luyện", "Đã quen") using `label-sm` style.

### Review Activities

- **Mini test:** Hiển thị 2, 4 hoặc 6 ảnh lớn theo tuổi trong grid responsive, không có tên từ dưới ảnh. Tất cả ảnh nằm trọn màn hình; audio phát xong mới chuyển sang trạng thái có thể chọn.
- **Replay:** Nút “Phát lại” lớn nằm dưới grid ảnh và có disabled state rõ nhưng nhẹ khi audio đang phát.
- **Wrong choice:** Chỉ rung ngang nhẹ hình vừa chọn; không dùng chữ lỗi, dấu X đỏ, màu error mạnh hoặc âm báo lỗi.
- **Correct choice:** Hình nổi/phóng nhẹ; không thêm viền sáng mạnh. Menu hoàn thành chỉ xuất hiện sau bước chúc mừng.
- **Puzzle:** Khung trống ở trên, khay mảnh ở dưới, không số/chữ/ảnh mờ và không cuộn. Hình hoàn chỉnh chỉ nổi lên nhẹ khi ghép xong.
- **Memory:** Mặt sau dùng logo KidEDU. Cặp đúng thu nhỏ + mờ dần rồi biến mất; không dùng confetti hoặc flash mạnh.
- **Completion actions:** Các nút “Tiếp tục”, “Chơi lại”, “Trò chơi” và “Học tiếp” dùng Child button style lớn, tối đa ba lựa chọn cùng lúc.

### Inputs (Parent Zone)

- **Fields:** Rounded containers with a 2px border in `sage-green`.
- **Media Uploaders:** Large "Drop-zone" areas with dashed borders and descriptive icons for "Add Video" or "Add Photo."

### Parent Gate

- A simple math or gesture-based interaction (e.g., "Hold for 3 seconds") presented in a large, clear modal to prevent children from exiting the learning flow.

### Lists

- Spaced widely (16px gap) with rounded separators to ensure each list item is a distinct "touch target."
