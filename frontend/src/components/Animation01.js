import {memo} from 'react';
import "../styles/css/animation.css";

const HorizontalChartAnimation = memo(({ 
  speed="2s", 
  rotate="0deg", 
  width = "60px", 
  height = "30px",
  borderWidth = "1px",
  borderColor = "#cccccc",
  borderStyle = "solid",
  borderRadius = "5px"
}) => {
      
    const style = {
      "rotate": rotate,
      "width": width, 
      "height": height, 
      "border-radius": borderRadius,
      "border": `${borderWidth} ${borderStyle} ${borderColor}`,
      "display": "inline-block",
      "background": "linear-gradient(90deg, #fff 5%, #8ea9ff 90%, #fff 5%)",
      "background-size": "200% 100%",
      "background-repeat": "no-repeat",
      "background-position": "right", // Start positioned at the right
      "animation": "horizontalPlaceholderAnimation " + speed + " infinite linear",
      "padding": "0px"
    }; 
          
    return (
        <div style={{"padding": "0px"}}>
            <div style={style}>
            </div>
        </div>
    );
});

export default HorizontalChartAnimation;
