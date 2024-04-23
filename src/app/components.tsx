"use client";

import { ResponsiveSunburst } from "@nivo/sunburst";
import { initialData } from "./data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { createContext, useContext, useState } from "react";

type QueryResponse = {
  results: (string | number | null)[][];
};

interface PathNode {
  name: string;
  color: string;
  children?: PathNode[];
  count?: number;
}

const presetColors = [
  "#6ab974",
  "#cb3a3e",
  "#5587d3",
  "#e28850",
  "#a270d2",
  "#f94144ff",
  "#277da1ff",
  "#4d908eff",
  "#43aa8bff",
  "#f8961eff",
  "#90be6dff",
  "#f9c74fff",
  "#f9844aff",
  "#f3722cff",
  "#577590ff",
];
function convertToHierarchy(
  data: { pathTaken: string; count: number }[],
  colors: Map<string, string>
) {
  const root: PathNode = { name: "Root", children: [], color: "" };

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
          color: colors.get(nodeName) ?? presetColors[i % colors.size],
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
import Sketch from "@uiw/react-color-sketch";
import { DatePickerDemo } from "@/components/ui/date-picker";
import { format } from "date-fns";

function ColorPicker(props: { initialColor: string; label: string }) {
  const { chartOptions, setChartOptions } = useQueryContext();
  const [hex, setHex] = useState(props.initialColor ?? "#fff");
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            style={{
              backgroundColor: hex,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-palette"
            >
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <Sketch
            color={hex}
            disableAlpha={true}
            onChange={(color) => {
              setHex(color.hex);
              setChartOptions({
                ...chartOptions,
                colors: new Map(chartOptions?.colors ?? []).set(
                  props.label,
                  color.hex
                ),
              });
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const MyResponsiveSunburst = () => {
  const { query, chartOptions } = useQueryContext();
  const { apiKey, depth, host, match, projectId } = query ?? {};
  const { data, error, isLoading } = useQuery({
    queryKey: ["query", query],
    // initialData,
    enabled: !!projectId && !!apiKey,
    queryFn: () =>
      // TODO: Support custom endpoint
      fetch(
        `https://${
          query?.host ?? "us.posthog.com"
        }/api/projects/${projectId}/query/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: {
              kind: "HogQLQuery",
              // Result is in format: path_taken, count
              query: `WITH ${query?.depth ?? 5} as lim,\n[${(
                query?.match ?? []
              ).map((m) => `'${m.label}'`)}] as groupings_labels,\n[${(
                query?.match ?? []
              ).map((m) => `'${m.regex}'`)}] as groupings_regex,\n'${format(
                query?.start!,
                "yyyy-MM-dd"
              )} 00:00:00' as start_time,\n'${format(
                query?.end!,
                "yyyy-MM-dd"
              )} 23:59:59' as end_time,\nraw_events as (SELECT\n                        events.timestamp,\n                        events.$session_id,\n                        ifNull(if(equals(event, '$pageview'), replaceRegexpAll(ifNull(properties.$current_url, ''), '(.)/$', '\\\\1'), event), '') AS path_item_ungrouped,                    \n                        multiMatchAnyIndex(path_item_ungrouped, groupings_regex) AS group_index,\n                        (if(greater(group_index, 0), groupings_labels[group_index], 'Other') AS path_item) AS path_item\n                    FROM\n                        events\n                    WHERE\n                        and(\n                            and(greaterOrEquals(events.timestamp, toStartOfDay(assumeNotNull(toDateTime(start_time)))), \n                                lessOrEquals(events.timestamp, assumeNotNull(toDateTime(end_time)))\n                                ), \n                        equals(event, '$pageview')\n                        )\n                    ORDER BY\n                        $session_id ASC,\n                        events.timestamp ASC\n                    ),\n\ngrouped_events as (SELECT\n                    $session_id,                    \n                    arraySlice(groupArray(path_item), 1 ,lim) AS path_list\n                FROM\n                    raw_events\n                GROUP BY\n                    $session_id)\nSELECT concat(arrayStringConcat(path_list, '->'), '->End') AS path_taken, count(*) as count \nFROM grouped_events \ngroup by path_taken \norder by count desc LIMIT 10000`,
            },
          }),
        }
      ).then(async (res) => {
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
  if (!data) return null;

  const colors = chartOptions?.colors ?? new Map();
  const converted = convertToHierarchy(data, colors);
  return (
    <div className="flex flex-row items-center h-full w-full gap-8">
      <div className="flex flex-col gap-2">
        {
          // @ts-expect-error
          [...colors.entries()].map(([label, color]) => (
            <div
              key={label}
              className="flex flex-row items-center gap-2 px-2 py-1"
              style={{
                backgroundColor: color,
                borderRadius: "0.5rem",
              }}
            >
              <div className="px-2 py-1 text-white">{label}</div>
            </div>
          ))
        }
      </div>

      <ResponsiveSunburst
        id="name"
        value="count"
        data={{
          children: converted,
        }}
        colors={
          // for the first level, use the colors in order since nivo is weird
          converted?.map((child) => child.color)
        }
        childColor={(parent, child) => {
          // @ts-expect-error
          return child.data.color;
        }}
        borderWidth={1}
        enableArcLabels={false}
        arcLabelsSkipAngle={10}
      />
    </div>
  );
};

const formSchema = z.object({
  apiKey: z.string().min(1),
  // refine a string into a number
  projectId: z.number({
    coerce: true,
  }),
  host: z.string(),
  match: z
    .object({
      label: z.string(),
      regex: z.string(),
    })
    .array(),
  depth: z.number({
    coerce: true,
  }),
  start: z.date(),
  end: z.date(),
});

const matchSchema = z.object({
  label: z.string(),
  regex: z.string(),
});

export type QueryContext = z.infer<typeof formSchema>;
export type ChartOptions = {
  colors: Map<string, string>;
};

const context = createContext<null | {
  query: QueryContext | null;
  setQuery: (query: QueryContext) => void;
  chartOptions: ChartOptions | null;
  setChartOptions: (options: ChartOptions) => void;
}>(null);
export const useQueryContext = () => {
  const ctx = useContext(context);
  if (!ctx) {
    throw new Error("useQueryContext must be used within a QueryProvider");
  }
  return ctx;
};
export const QueryProvider = context.Provider;

export function MatchPopover(props: {
  onMatchesChange: (matches: z.infer<typeof matchSchema>[]) => void;
}) {
  const form = useForm<z.infer<typeof matchSchema>>({
    resolver: zodResolver(matchSchema),
    defaultValues: {},
  });
  function onSubmit(values: z.infer<typeof matchSchema>) {
    setMatches((prev) => [...prev, values]);
    props.onMatchesChange([...matches, values]);
  }

  const [matches, setMatches] = useState<z.infer<typeof matchSchema>[]>([]);

  return (
    <div className="flex-row flex gap-4 py-4 flex-wrap">
      {matches.map((match, index) => (
        <div
          key={index}
          className="border border-input bg-background shadow-sm inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium"
        >
          <Button
            variant="ghost"
            className="py-4 text-xs"
            onClick={() => {
              props.onMatchesChange(matches.filter((_, i) => i !== index));
              setMatches((prev) => {
                return prev.filter((_, i) => i !== index);
              });
            }}
          >
            X
          </Button>
          <span className="pl-1 pr-3">
            {match.label}: {match.regex}
          </span>
        </div>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Add Path Match</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Search" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="regex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regex</FormLabel>
                    <FormControl>
                      <Input placeholder="/search.*" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PopoverClose asChild>
                <Button type="submit">Submit</Button>
              </PopoverClose>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function Sidebar() {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host: "us.posthog.com",
      depth: 5,
      // 7 days ago
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
  });

  const queryContext = useQueryContext();
  function onSubmit(values: z.infer<typeof formSchema>) {
    queryContext.setQuery(values);
    queryClient.invalidateQueries({
      exact: false,
      queryKey: ["query"],
    });
    queryClient.cancelQueries({
      exact: false,
      queryKey: ["query"],
    });
    const colors: Array<[string, string]> = values.match.map((match, i) => {
      if (queryContext.chartOptions?.colors?.has(match.label)) {
        return [
          match.label,
          queryContext.chartOptions.colors.get(match.label)!,
        ];
      }
      return [match.label, presetColors[i % presetColors.length]];
    });
    queryContext.setChartOptions({
      ...queryContext.chartOptions,
      colors: new Map<string, string>([
        ...colors,
        ["Other", "#a270d2"],
        ["End", "#bababa"],
      ]),
    });
  }

  return (
    <div className="w-[350px] border-r-2 px-2 flex-grow-1 shrink-0 ">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          id="query"
        >
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Api Key</FormLabel>
                <FormControl>
                  <Input placeholder="phx_..." type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Id</FormLabel>
                <FormControl>
                  <Input placeholder="345..." type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Host</FormLabel>
                <FormControl>
                  <Input placeholder="us.posthog.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="depth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depth</FormLabel>
                <FormControl>
                  <Input placeholder="5" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start</FormLabel>
                <FormControl>
                  <DatePickerDemo
                    onChange={(date) => {
                      form.setValue("start", date);
                    }}
                    date={form.watch("start")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="depth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End</FormLabel>
                <FormControl>
                  <DatePickerDemo
                    onChange={(date) => {
                      form.setValue("end", date);
                    }}
                    date={form.watch("end")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <MatchPopover
        onMatchesChange={(matches) => {
          form.setValue("match", matches);
        }}
      />
      <div className="w-full flex justify-end">
        <Button type="submit" form="query">
          Update & Run
        </Button>
      </div>
      <div className="pt-4 text-sm font-light">
        All processing happens locally, your API key is only sent to PostHog,
        not our servers.
      </div>
      <div className="pt-4 text-sm font-bold">
        Make sure to have your adblocker disabled as most block PostHog
      </div>
    </div>
  );
}

export function BottomBar() {
  const { chartOptions } = useQueryContext();
  const colors = chartOptions?.colors ?? new Map();
  return (
    <div className="border-t-2 w-full px-2 flex-grow-1 shrink-0">
      <div className="flex flex-col gap-2">
        <span className="font-semibold">Color Override</span>
        {
          // @ts-expect-error
          [...colors.entries()].map(([label, color]) => (
            <div
              key={label}
              className="flex flex-row items-center gap-2"
              style={{
                color: "white",
                borderRadius: "0.5rem",
              }}
            >
              <ColorPicker initialColor={color} label={label} />
              <div className="px-2 py-1 text-black">{label}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
