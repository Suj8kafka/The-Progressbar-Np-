// const btnStart= document.querySelector('.btn-start'); 
// const timeSpan= document.querySelector('.time'); 
// const progressBar= document.querySelector('.progress-inner'); 


// //btnStart.addEventListener("click", ()=> { 
  
//     //let interval =0 ; 
//    // var countDown = setInterval(() => {
//       //  interval++; 
//        // let progressWidth =(interval/10)* 100; 
//         //if (interval<=100){ 
//             // }
//             // else{ 
//                 //     clearInterval(countDown)
//                 //     progressBar.style.width="0%"; 
//                 //     timeSpan.innerHTML= "Game OVer!"
//                 // }
//                 //   }, 1000);
//                 var numpy= 0; 
//                 var gate= 142; 
//                 var datee= new Date(); 
//                 hour= datee.getHours(); 
//                 mins= datee.getMinutes(); 
//                 sec= datee.getSeconds();
//                 var CompletedTotal= (hour-1)*60*60; 
//                 if(hour ==0){ 
//                   hour=24; 
//                 } 
//                 if(mins ==0) { 
//                   mins = 60; 
//                 } 
//                 if (sec==0) { 
//                 sec= 60; 
//                 } 

//                 var total1= hour*mins*sec+(CompletedTotal); 
                
//                 // function diss(){
                
//                 //     return total1; 
//                 //     //console.log(total1); 
                
//                 // }
                
                
//                 var CurrentDay= 141
//                 var CurrSeconds= CurrentDay*24*60*60; 
//                 var total2 = CurrSeconds+total1; 
//                 //const Duck= diss(); 
//                 setInterval(() => {
//                 //let numpy = 1; 
//                 let totalSecsYears= 31536000; 
//                 total2+= 1; 
                
//                 let  ruunningSecs= (total2/totalSecsYears) *100;
//                     ruunningSecs=ruunningSecs.toFixed(8)
//                 console.log(ruunningSecs, total2); 
                
                 
//                 progressBar.style.width= ruunningSecs+"%"; 
//                 timeSpan.innerHTML= ruunningSecs+ '%'; 
//                 checkColors(ActualPercentage); 

//                 //let ActualProgressYears= (ruunningSecs/totalSecsYears) *1;
//                 //console.log(ActualProgressYears);  
                
//             }, 1000);
            
            
            
//             const checkColors = (width)=> { 
//                 if (width> 50 && width<80){ 
//                     progressBar.style.background= "yellow"; 
            
//                 }else if (width>80 )
//             {
//                 progressBar.style.background= "red"; 
//             }
            
//             }



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
                setInterval(() => {
                    
                    const currentDate = new Date();
                    
                    // Get the year of the current date
                    const currentYear = currentDate.getFullYear();
                    
                    // Create a new Date object for the start of the year
                    const startOfYear = new Date(currentYear, 0, 1);
                    
                    // Create a new Date object for the start of the next year
                    const nextYear = new Date(currentYear + 1, 0, 1);
                    
                    // Calculate the total number of milliseconds in the year
                    const totalTime = nextYear.getTime() - startOfYear.getTime();
                    
                    // Calculate the number of milliseconds elapsed from the start of the year to the current date
                const elapsedTime = currentDate.getTime() - startOfYear.getTime();
                
                // Calculate the percentage of the year that has passed
                const percentage = (elapsedTime / totalTime) * 100;
                const roundedPercentage = percentage.toFixed(8);
                    //console.log(roundedPercentage);
                    var DiffPercentage= 28.35559655409437; 
                     var RealTimePercentage= roundedPercentage- DiffPercentage;
                     RealTimePercentage= RealTimePercentage.toFixed(6) 
                console.log(RealTimePercentage); 
                
                
                
                progressBar.style.width= RealTimePercentage +"%"; 
                timeSpan.innerHTML= RealTimePercentage+ '%'; 
                checkColors(realtimeClock); 
                
                //let ActualProgressYears= (ruunningSecs/totalSecsYears) *1;
                //console.log(ActualProgressYears);  
                
            }, 500);          
                
                
                
            const checkColors = (width)=> { 
                if (width> 50 && width<80){ 
                    progressBar.style.background= "yellow"; 
            
                }else if (width>80 )
                {
                    progressBar.style.background= "red"; 
                }
                
            }

            
            
