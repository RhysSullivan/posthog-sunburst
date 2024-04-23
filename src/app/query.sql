WITH raw_events as (SELECT
                        events.timestamp,
                        events.$session_id,
                        ifNull(if(equals(event, '$pageview'), replaceRegexpAll(ifNull(properties.$current_url, ''), '(.)/$', '\\1'), event), '') AS path_item_ungrouped,
                        -- These are the labels
                        ['Post', 'Community', 'Home', 'Search'] AS groupings, 
                        -- This is the matcher
                        multiMatchAnyIndex(path_item_ungrouped, ['/m/.*', '/c/.*', '.com$', '/search.*']) AS group_index,
                        (if(greater(group_index, 0), groupings[group_index], 'Other') AS path_item) AS path_item
                    FROM
                        events
                    WHERE
                        and(
                            and(greaterOrEquals(events.timestamp, toStartOfDay(assumeNotNull(toDateTime('2024-04-14 00:00:00')))), 
                                lessOrEquals(events.timestamp, assumeNotNull(toDateTime('2024-04-21 23:59:59')))
                                ), 
                        equals(event, '$pageview'),
                        equals(properties.$host, 'www.answeroverflow.com')
                        
                        )
                    ORDER BY
                        $session_id ASC,
                        events.timestamp ASC
                    ),

grouped_events as (SELECT
                    $session_id,                    
                    arraySlice(groupArray(path_item), 1 ,5) AS path_list
                FROM
                    raw_events
                GROUP BY
                    $session_id)
SELECT concat(arrayStringConcat(path_list, '->'), '->End') AS path_taken, count(*) as count 
FROM grouped_events 
group by path_taken 
order by count desc