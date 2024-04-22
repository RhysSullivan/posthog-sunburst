WITH raw_data AS (
            SELECT
            events.timestamp,          
            events.person_id,          
            -- Extracting and cleaning up path items
            ifNull(if(equals(event, '$pageview'), replaceRegexpAll(ifNull(properties.$current_url, ''), '(.)/$', '\\1'), event), '') AS path_item_ungrouped,
            NULL AS groupings,                  -- Placeholder for grouping information
            multiMatchAnyIndex(path_item_ungrouped, NULL) AS group_index,
            -- Grouping similar path items
            (if(greater(group_index, 0), groupings[group_index], path_item_ungrouped) AS path_item) AS path_item
        FROM
            events
        WHERE
            -- Filtering events within a specific time range and type
            and(true, and(greaterOrEquals(events.timestamp, toStartOfDay(assumeNotNull(toDateTime('2024-04-13 00:00:00')))), lessOrEquals(events.timestamp, assumeNotNull(toDateTime('2024-04-20 23:59:59')))), equals(event, '$pageview'))
        ORDER BY
            person_id ASC,
            events.timestamp ASC
),

-- Subquery to group and aggregate data by person_id
session_data AS 
                (SELECT
                    person_id,                              
                    groupArray(timestamp) AS timing_list,  
                    groupArray(path_item) AS path_list     
                FROM
                    raw_data
                GROUP BY
                    person_id),

-- Subquery to process and extract relevant information from the session_data
processed_data AS 
            (SELECT
                person_id,                                  -- Unique identifier for the person
                path_time_tuple.1 AS path_basic,           -- Basic path of events
                path_time_tuple.2 AS time,                 -- Time between events
                session_index,                              -- Index of the session
                -- Splitting sessions into individual paths
                arrayZip(path_list, timing_list, arrayDifference(timing_list)) AS paths_tuple,
                arraySplit(x -> if(less(x.3, 1800), 0, 1), paths_tuple) AS session_paths
            FROM
                session_data
            -- Exploding session paths into individual events with their timing differences
            ARRAY JOIN session_paths AS path_time_tuple, arrayEnumerate(session_paths) AS session_index),

filtered_data as -- Subquery to process and extract relevant information from the raw data
        (SELECT
            person_id,                                      -- Unique identifier for the person
            joined_path_tuple.1 AS path,                    -- Path of events
            joined_path_tuple.2 AS conversion_time,         -- Time between events
            joined_path_tuple.3 AS prev_path,               -- Previous path
            event_in_session_index,                         -- Index of the event in the session
            session_index,                                  -- Index of the session
            -- Preprocessing steps to clean up and filter the path
            arrayPopFront(arrayPushBack(path_basic, '')) AS path_basic_0,
            arrayMap((x, y) -> if(equals(x, y), 0, 1), path_basic, path_basic_0) AS mapping,
            arrayFilter((x, y) -> y, time, mapping) AS timings,
            arrayFilter((x, y) -> y, path_basic, mapping) AS compact_path,
            indexOf(compact_path, NULL) AS target_index,
            if(greater(target_index, 0), arraySlice(compact_path, target_index), compact_path) AS filtered_path,
            arraySlice(filtered_path, 1, 5) AS limited_path,
            if(greater(target_index, 0), arraySlice(timings, target_index), timings) AS filtered_timings,
            arraySlice(filtered_timings, 1, 5) AS limited_timings,
            arrayDifference(limited_timings) AS timings_diff,
            -- Generating a key to identify where the path ended
            concat(toString(length(limited_path)), '_', limited_path[-1]) AS path_dropoff_key,
            -- Combining limited path with time differences between events
            arrayZip(limited_path, timings_diff, arrayPopBack(arrayPushFront(limited_path, ''))) AS limited_path_timings
        FROM
            processed_data
        -- Exploding limited path timings into individual events with their timing differences
        ARRAY JOIN limited_path_timings AS joined_path_tuple, arrayEnumerate(limited_path_timings) AS event_in_session_index
        )

-- Selecting relevant fields and calculating aggregate statistics for event paths
SELECT
    last_path_key AS source_event,                          -- Source event in the path
    path_key AS target_event,                               -- Target event in the path
    count(*) AS event_count,                                -- Count of occurrences of this path
    avg(conversion_time) AS average_conversion_time         -- Average time between events in this path
FROM
    -- Subquery to preprocess and generate necessary data for analysis
    (SELECT
        person_id,                                          -- Unique identifier for the person
        path,                                               -- Full path of events
        conversion_time,                                    -- Time between events
        event_in_session_index,                             -- Index of the event in the session
        concat(toString(event_in_session_index), '_', path) AS path_key,            -- Unique key for the current path
        if(greater(event_in_session_index, 1), concat(toString(minus(event_in_session_index, 1)), '_', prev_path), NULL) AS last_path_key, -- Key for the previous path
        path_dropoff_key                                    -- Key indicating where the path ended
    FROM
        filtered_data
    )
-- Filtering out rows where the source event is null
WHERE
    notEquals(source_event, NULL)
-- Grouping results by source and target events
GROUP BY
    source_event,
    target_event
-- Ordering results by event count in descending order, and then by source and target events
ORDER BY
    event_count DESC,
    source_event ASC,
    target_event ASC
-- Limiting the number of results to 50
LIMIT 50