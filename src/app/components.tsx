"use client";

import { ResponsiveSunburst } from "@nivo/sunburst";
import { data } from "./data";

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const MyResponsiveSunburst = () => (
  <ResponsiveSunburst
    data={data}
    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
    id="name"
    value="loc"
    cornerRadius={2}
    borderColor={{ theme: "background" }}
    colors={{ scheme: "nivo" }}
    childColor={{
      from: "color",
      modifiers: [["brighter", 0.1]],
    }}
    enableArcLabels={true}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor={{
      from: "color",
      modifiers: [["darker", 1.4]],
    }}
  />
);
