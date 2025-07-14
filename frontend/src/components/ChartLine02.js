import { memo } from 'react';
import { LineChart, Box, Button } from '@cloudscape-design/components';

const ChartLine = memo(({ series, height, width = "100%", title, border = 2, stacked = false, maximum = 0 }) => {

      const parsedSeries = typeof series === 'string' ? JSON.parse(series) : series;

      const transformedSeries = parsedSeries.map(seriesItem => {
            // CloudScape expects { x: Date, y: number } format for each data point
            const transformedData = seriesItem.data.map(point => ({
              x: new Date(point[0]), 
              y: point[1]
            }));

            return {
              title: seriesItem.name || '',
              type: 'line',
              data: transformedData
            };
      });

      height = height.replace("px", "");
      

  return (
    
      <LineChart
          series={transformedSeries}      
          i18nStrings={{
            xTickFormatter: e =>
              e
                .toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: !1
                })
                .split(",")
                .join("\n"),
            yTickFormatter: function o(e) {
              return Math.abs(e) >= 1e9
                ? (e / 1e9).toFixed(1).replace(/\.0$/, "") +
                    "G"
                : Math.abs(e) >= 1e6
                ? (e / 1e6).toFixed(1).replace(/\.0$/, "") +
                  "M"
                : Math.abs(e) >= 1e3
                ? (e / 1e3).toFixed(1).replace(/\.0$/, "") +
                  "K"
                : e.toFixed(2);
            }
          }}      
          ariaLabel="Single data series line chart"
          height={height}
          hideFilter          
          xScaleType="time"
          xTitle=""
          yTitle={title}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data available</b>
              <Box variant="p" color="inherit">
                There is no data available
              </Box>
            </Box>
          }
          noMatch={
            <Box textAlign="center" color="inherit">
              <b>No matching data</b>
              <Box variant="p" color="inherit">
                There is no matching data to display
              </Box>
              <Button>Clear filter</Button>
            </Box>
          }
    />    
  );
});

export default ChartLine;