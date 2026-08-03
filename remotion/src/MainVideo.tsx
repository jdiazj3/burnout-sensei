import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { Scene7 } from "./scenes/Scene7";
import { Scene8 } from "./scenes/Scene8";

const timing = springTiming({ config: { damping: 200 }, durationInFrames: 20 });
const durations = [200, 240, 240, 240, 300, 300, 260, 160];
const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8];

export const MainVideo: React.FC = () => (
  <AbsoluteFill>
    <PersistentBackground />
    <TransitionSeries>
      {scenes.flatMap((S, i) => {
        const seq = (
          <TransitionSeries.Sequence key={`s${i}`} durationInFrames={durations[i]}>
            <S />
          </TransitionSeries.Sequence>
        );
        if (i === scenes.length - 1) return [seq];
        const trans = (
          <TransitionSeries.Transition
            key={`t${i}`}
            presentation={i % 2 === 0 ? wipe({ direction: "from-right" }) : fade()}
            timing={timing}
          />
        );
        return [seq, trans];
      })}
    </TransitionSeries>
  </AbsoluteFill>
);
