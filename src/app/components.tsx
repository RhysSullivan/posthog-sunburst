"use client";

import { ResponsiveSunburst } from "@nivo/sunburst";
import { data as fakeData, initialData } from "./data";
import { useQuery } from "@tanstack/react-query";

type QueryResponse = {
  results: (string | number)[][];
};

type ParsedResults = {
  source_event: string;
  target_event: string;
  event_count: number;
};

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
      fetch(`https://us.posthog.com/api/projects/${projectId}/query/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            query:
              "SELECT\n    last_path_key AS source_event,\n    path_key AS target_event,\n    count(*) AS event_count,\n    avg(conversion_time) AS average_conversion_time\nFROM\n    (SELECT\n        person_id,\n        path,\n        conversion_time,\n        event_in_session_index,\n        concat(toString(event_in_session_index), '_', path) AS path_key,\n        if(greater(event_in_session_index, 1), concat(toString(minus(event_in_session_index, 1)), '_', prev_path), NULL) AS last_path_key,\n        path_dropoff_key\n    FROM\n        (SELECT\n            person_id,\n            joined_path_tuple.1 AS path,\n            joined_path_tuple.2 AS conversion_time,\n            joined_path_tuple.3 AS prev_path,\n            event_in_session_index,\n            session_index,\n            arrayPopFront(arrayPushBack(path_basic, '')) AS path_basic_0,\n            arrayMap((x, y) -> if(equals(x, y), 0, 1), path_basic, path_basic_0) AS mapping,\n            arrayFilter((x, y) -> y, time, mapping) AS timings,\n            arrayFilter((x, y) -> y, path_basic, mapping) AS compact_path,\n            indexOf(compact_path, NULL) AS target_index,\n            if(greater(target_index, 0), arraySlice(compact_path, target_index), compact_path) AS filtered_path,\n            arraySlice(filtered_path, 1, 5) AS limited_path,\n            if(greater(target_index, 0), arraySlice(timings, target_index), timings) AS filtered_timings,\n            arraySlice(filtered_timings, 1, 5) AS limited_timings,\n            arrayDifference(limited_timings) AS timings_diff,\n            concat(toString(length(limited_path)), '_', limited_path[-1]) AS path_dropoff_key,\n            arrayZip(limited_path, timings_diff, arrayPopBack(arrayPushFront(limited_path, ''))) AS limited_path_timings\n        FROM\n            (SELECT\n                person_id,\n                path_time_tuple.1 AS path_basic,\n                path_time_tuple.2 AS time,\n                session_index,\n                arrayZip(path_list, timing_list, arrayDifference(timing_list)) AS paths_tuple,\n                arraySplit(x -> if(less(x.3, 1800), 0, 1), paths_tuple) AS session_paths\n            FROM\n                (SELECT\n                    person_id,\n                    groupArray(timestamp) AS timing_list,\n                    groupArray(path_item) AS path_list\n                FROM\n                    (SELECT\n                        events.timestamp,\n                        events.person_id,\n                        ifNull(if(equals(event, '$pageview'), replaceRegexpAll(ifNull(properties.$current_url, ''), '(.)/$', '\\\\1'), event), '') AS path_item_ungrouped,\n                        ['/m/*', '/c/*'] AS groupings,\n                        multiMatchAnyIndex(path_item_ungrouped, ['/m/.*', '/c/.*']) AS group_index,\n                        (if(greater(group_index, 0), groupings[group_index], path_item_ungrouped) AS path_item) AS path_item\n                    FROM\n                        events\n                    WHERE\n                        and(equals(properties.$host, 'www.answeroverflow.com'), and(greaterOrEquals(events.timestamp, toStartOfDay(assumeNotNull(toDateTime('2024-04-14 00:00:00')))), lessOrEquals(events.timestamp, assumeNotNull(toDateTime('2024-04-21 23:59:59')))), equals(event, '$pageview'))\n                    ORDER BY\n                        person_id ASC,\n                        events.timestamp ASC)\n                GROUP BY\n                    person_id)\n            ARRAY JOIN session_paths AS path_time_tuple, arrayEnumerate(session_paths) AS session_index)\n        ARRAY JOIN limited_path_timings AS joined_path_tuple, arrayEnumerate(limited_path_timings) AS event_in_session_index))\nWHERE\n    notEquals(source_event, NULL)\nGROUP BY\n    source_event,\n    target_event\nORDER BY\n    event_count DESC,\n    source_event ASC,\n    target_event ASC\nLIMIT 50",
            filters: { dateRange: { date_from: "-7d" } },
          },
        }),
      }).then(async (res) => {
        const json = (await res.json()) as QueryResponse;
        return json.results.map((result) => {
          return {
            source_event: result[0]!,
            target_event: result[1]!,
            event_count: result[2]!,
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
  console.log(data);
  if (data) {
    return data.map((result) => {
      return (
        <>
          {result.source_event}
          {result.target_event}
          {result.event_count}
        </>
      );
    });
  }
  return (
    <ResponsiveSunburst
      data={fakeData}
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
};

export function Sidebar() {
  return (
    <div className="max-w-[300px] w-[300px] shrink-0 flex-grow border-r-4">
      <h1 className="text-4xl">Sidebar</h1>
    </div>
  );
}
