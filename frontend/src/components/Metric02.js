import {useState,useEffect,useRef} from 'react'
import Chart from 'react-apexcharts';

function Metric({ value, history, timestamp, title, precision, format=1, height="20px", width = "50px",type = "line", fontSizeTitle = "11px", fontSizeValue = "22px", fontColorTitle = "#2ea597", fontColorValue = "orange", chartColorLine = "#F6CE55" }) {

    const [dataset,setDataset] = useState({   
                                            value : 0, 
                                            chart : [{ data : Array(0).fill(null) }] 
    });
   
    var options = {
                    chart: {
                      type: type,
                      sparkline: {
                        enabled: true
                      },
                      animations: {
                        enabled: false,
                      },
                    },
                    stroke: {
                      curve: 'straight'
                    },
                    fill: {
                      opacity: 0.3
                    },
                    plotOptions: {
                      bar: {
                        columnWidth: '80%'
                      }
                    },
                    markers: {
                        size: 0,
                        strokeColors: '#29313e',
                    },                           
                    tooltip: {
                      theme: "dark",
                      fixed: {
                        enabled: false
                      },                      
                    },
                    theme: {
                      palette : "palette2"
                    },
        };
        
    
    function updateMetrics(){
      try {
            
            
            history = history.map(item => item[1]);

            switch (format) {
              case 1:
                setDataset({ value : CustomFormatNumberRaw(value,precision), chart : [{ data : history }] });
                break;
                
              case 2:
                setDataset({ value : CustomFormatNumberData(value,precision), chart : [{ data : history }] });
                break;
              
              case 3:
                setDataset({ value : CustomFormatNumberRawInteger(value,0), chart : [{ data : history }] });
                break;
              
            }

            console.log('UpdateMetrics');

      }
      catch{
        console.log('error');
      }
      
       
    }
    
    // eslint-disable-next-line
    useEffect(() => {
      updateMetrics();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timestamp]);
    
    
    
    function CustomFormatNumberData(value,decimalLength) {
        if(value == 0) return '0';
        if(value < 1024) return parseFloat(value).toFixed(decimalLength);
        
        var k = 1024,
        sizes = ['', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZT', 'YB'],
        i = Math.floor(Math.log(value) / Math.log(k));
        return parseFloat((value / Math.pow(k, i)).toFixed(decimalLength)) + ' ' + sizes[i];
    }
    
    
    function CustomFormatNumberRaw(value,decimalLength) {
        if (value < 100 && decimalLength == 0 )
          decimalLength=2;
       
        if (value==0)
          decimalLength=0;

        return value.toLocaleString('en-US', {minimumFractionDigits:decimalLength, maximumFractionDigits:decimalLength}); 

    }
    
    function CustomFormatNumberRawInteger(value,decimalLength) {
        return value.toLocaleString('en-US', {minimumFractionDigits:decimalLength, maximumFractionDigits:decimalLength}); 
    }
    
    return (
            <div style={{ "padding" : "0px"}}>
     
                <table style={{"width":"100%", "padding" : "0px"}}>
                    <tr>
                        <td style={{"text-align":"center", "padding-left": "1em"}}>
                              <div style={{"font-size": fontSizeValue, "font-weight": "900","font-family": "Lato",  }}>
                                  {dataset.value}
                              </div>
                              <div style={{"font-size": fontSizeTitle,"font-weight": "450","font-family": "Lato", "color" : fontColorTitle   }}>
                                  {title}
                              </div>      
                        </td>
                    </tr>
                </table>                               
                <table style={{"width":"100%"}}>
                    <tr>
                        <td style={{"justify-content": "center","display": "flex" }}>
                              <div style={{ "height":height, "width":width}}>
                                 <Chart options={options} series={dataset.chart} type={type} height={height} width={width} />
                              </div>  
                        </td>
                    </tr>
                </table>
                
                
                
                
          
            </div>
            
            
            
           )
}

export default Metric
