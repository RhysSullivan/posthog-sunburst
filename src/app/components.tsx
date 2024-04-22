"use client";

import { ResponsiveSunburst } from "@nivo/sunburst";
import { initialData } from "./data";
import { useQuery } from "@tanstack/react-query";

type QueryResponse = {
  results: (string | number | null)[][];
};

interface PathNode {
  name: string;
  color: string;
  children?: PathNode[];
  count?: number;
}

const colorMap = {
  Home: "hsl(128, 36%, 57%)",
  Search: "hsl(358, 58%, 51%)",
  Post: "hsl(216, 59%, 58%)",
  Community: "hsl(23, 72%, 60%)",
  Other: "hsl(271, 52%, 63%)",
  End: "hsl(0, 0%, 73%)",
} as const;

function convertToHierarchy(data: { pathTaken: string; count: number }[]) {
  const root: PathNode = { name: "Root", children: [] };

  data.forEach((item) => {
    const path = item.pathTaken.split("->");
    let currentNode = root;

    for (let i = 0; i < path.length; i++) {
      const nodeName = path[i];
      let childNode = currentNode.children?.find(
        (node) => node.name === nodeName
      );

      if (!childNode) {
        childNode = {
          name: nodeName,
          color: colorMap[nodeName],
        };
        currentNode.children = currentNode.children || [];
        currentNode.children.push(childNode);
      }

      if (i === path.length - 1) {
        childNode.count = item.count;
      }

      currentNode = childNode;
    }
  });

  return root.children; // Assuming there's only one root node
}

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const MyResponsiveSunburst = () => {
  const projectId = 0;
  const apiToken = "";
  const { data, error, isLoading } = useQuery({
    queryKey: ["data"],
    initialData,
    enabled: apiToken !== "" && projectId !== 0,
    queryFn: () =>
      // TODO: Support custom endpoint
      fetch(`https://us.posthog.com/api/projects/${projectId}/query/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            // Result is in format: path_taken, count
            query:
              "WITH raw_events as (SELECT\n                        events.timestamp,\n                        events.$session_id,\n                        ifNull(if(equals(event, '$pageview'), replaceRegexpAll(ifNull(properties.$current_url, ''), '(.)/$', '\\\\1'), event), '') AS path_item_ungrouped,\n                        -- These are the labels\n                        ['Post', 'Community', 'Home', 'Search'] AS groupings, \n                        -- This is the matcher\n                        multiMatchAnyIndex(path_item_ungrouped, ['/m/.*', '/c/.*', '.com$', '/search.*']) AS group_index,\n                        (if(greater(group_index, 0), groupings[group_index], 'Other') AS path_item) AS path_item\n                    FROM\n                        events\n                    WHERE\n                        and(\n                            and(greaterOrEquals(events.timestamp, toStartOfDay(assumeNotNull(toDateTime('2024-04-14 00:00:00')))), \n                                lessOrEquals(events.timestamp, assumeNotNull(toDateTime('2024-04-21 23:59:59')))\n                                ), \n                        equals(event, '$pageview'),\n                        equals(properties.$host, 'www.answeroverflow.com')\n                        \n                        )\n                    ORDER BY\n                        $session_id ASC,\n                        events.timestamp ASC\n                    ),\n\ngrouped_events as (SELECT\n                    $session_id,                    \n                    arraySlice(groupArray(path_item), 1 ,5) AS path_list\n                FROM\n                    raw_events\n                GROUP BY\n                    $session_id)\nSELECT concat(arrayStringConcat(path_list, '->'), '->End') AS path_taken, count(*) as count \nFROM grouped_events \nWHERE not(startsWith(path_taken, 'Post'))\ngroup by path_taken \norder by count desc LIMIT 10000",
            filters: { dateRange: { date_from: "-7d" } },
          },
        }),
      }).then(async (res) => {
        const json = (await res.json()) as QueryResponse;
        return json.results.map((result) => {
          return {
            pathTaken: result[0]!.toString(),
            count: Number(result[1]!),
          };
        });
      }),
  });

  if (isLoading) {
    // return tailwind loading spinner, take up 100% of div, center
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const converted = convertToHierarchy(data);
  return (
    <div className="flex flex-row items-center h-full w-full gap-8">
      <div className="flex flex-col gap-2">
        {Object.keys(colorMap).map((label) => {
          return (
            <div
              className="text-center w-full px-4 py-2"
              key={label}
              style={{
                backgroundColor: colorMap[label],
                color: "white",
                borderRadius: "0.5rem",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      <ResponsiveSunburst
        id="name"
        value="count"
        data={{
          children: converted,
        }}
        colors={
          // for the first level, use the colors in order since nivo is weird
          converted?.map((node) => node.color) || []
        }
        childColor={(parent, child) => {
          return child.data.color;
        }}
        borderColor={{ theme: "background" }}
        enableArcLabels={false}
        arcLabelsSkipAngle={10}
      />
    </div>
  );
};

export function Sidebar() {
  return (
    <div className="max-w-[300px] w-[300px] shrink-0 flex-grow border-r-4">
      <h1 className="text-4xl">Sidebar</h1>
    </div>
  );
}
