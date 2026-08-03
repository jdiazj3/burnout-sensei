import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSans } from "@remotion/google-fonts/DMSans";

export const display = loadDisplay("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
}).fontFamily;

export const sans = loadSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
}).fontFamily;

export const C = {
  bg: "#0D1117",
  bgSoft: "#121A22",
  ivory: "#F5F2EC",
  teal: "#2D8A9E",
  tealSoft: "rgba(45,138,158,0.18)",
  gold: "#C9A84C",
  muted: "rgba(245,242,236,0.55)",
  line: "rgba(245,242,236,0.14)",
};
