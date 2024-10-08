import React, { useState } from 'react';

const Progress=()=>{
    const [percent, changePercent] = useState("30%");
    return(
      <div>
        <div className="progress-back" style={{backgroundColor:"rgba(0,0,0,0.2)",width:"200px",height:"7px",borderRadius:"10px"}}>
          <div className="progress-bar" style={{backgroundColor:"#fe5196",width:percent,height:"100%",borderRadius:"10px"}}></div>
        </div>
        <button onClick={()=>{changePercent("70%")}}> 轉換百分比 </button>
      </div>
    );
}
export default Progress;