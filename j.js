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
                var numpy= 0; 
                var gate= 141; 
                var datee= new Date(); 
                hour= datee.getHours(); 
                mins= datee.getMinutes(); 
                sec= datee.getSeconds();
                var CompletedTotal= (hour-1)*60*60; 
                var total1= hour*mins*sec+(CompletedTotal); 
                
                // function diss(){
                
                //     return total1; 
                //     //console.log(total1); 
                
                // }
                
                
                var CurrentDay= 141
                var CurrSeconds= CurrentDay*24*60*60; 
                var total2 = CurrSeconds+total1; 
                //const Duck= diss(); 
                setInterval(() => {
                //let numpy = 1; 
                let totalSecsYears= 31536000; 
                total2+= 1; 
                
                let  ruunningSecs= (total2/totalSecsYears) *100;
                
                console.log(ruunningSecs, total2); 
                
                 
                progressBar.style.width= ruunningSecs+"%"; 
                timeSpan.innerHTML= ruunningSecs+ '%'; 
                checkColors(ActualPercentage); 

                //let ActualProgressYears= (ruunningSecs/totalSecsYears) *1;
                //console.log(ActualProgressYears);  
                
            }, 1000);
            
            
            
            const checkColors = (width)=> { 
                if (width> 50 && width<80){ 
                    progressBar.style.background= "yellow"; 
            
                }else if (width>80 )
            {
                progressBar.style.background= "red"; 
            }
            
            }



