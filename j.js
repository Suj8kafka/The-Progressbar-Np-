const btnStart= document.querySelector('.btn-start'); 
const timeSpan= document.querySelector('.time'); 
const progressBar= document.querySelector('.progress-inner'); 


//btnStart.addEventListener("click", ()=> { 
  
    //let interval =0 ; 
   // var countDown = setInterval(() => {
      //  interval++; 
       // let progressWidth =(interval/10)* 100; 
        //if (interval<=100){ 
            // }
            // else{ 
                //     clearInterval(countDown)
                //     progressBar.style.width="0%"; 
                //     timeSpan.innerHTML= "Game OVer!"
                // }
                //   }, 1000);
                function d(){ 
     var currdate = 141; 
     var r= new  Date(); 
     let hours = r.getHours(); 
     let minutes= r.getMinutes(); 
     let sec= r.getSeconds(); 
     let totalSecondsCurrdate= currdate*24*60*60;
     let runningSecs= hours*minutes*sec;
     let DynamicSeconds= totalSecondsCurrdate+ runningSecs  
     let ActualPercentage= DynamicSeconds/(365*24*60*60)* 100; 
     
     //console.log(hours, minutes, sec,"The Actual Running Time in Seconds", runningSecs); 
     ActualPercentage= ActualPercentage.toFixed(5)
     //console.log(ActualPercentage)
     if(hours>=23 && minutes>=59){ 
         currdate+=1; 
         
        }
        
        
        progressBar.style.width= ActualPercentage+"%"; 
        timeSpan.innerHTML= ActualPercentage+ '%'; 
    checkColors(ActualPercentage); 
    }
    
    setInterval(() => {
        d(); 
        
    }, 1);

//})

const checkColors = (width)=> { 
    if (width> 50 && width<80){ 
        progressBar.style.background= "yellow"; 

    }else if (width>80 )
{
    progressBar.style.background= "red"; 
}

}





