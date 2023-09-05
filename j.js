const btnStart= document.querySelector('.btn-start'); 
const timeSpan= document.querySelector('.time'); 
const progressBar= document.querySelector('.progress-inner'); 
const DayPerentage= document.querySelector('.percentageofDay'); 
const ProgressofDay= document.querySelector('.progressInn')


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
                const current_Date = new Date();
                
                // Get the start of the day
                const startOf_Day = new Date(current_Date.getFullYear(), current_Date.getMonth(), current_Date.getDate());
                
                // Get the end of the day
                const endOf_Day = new Date(current_Date.getFullYear(), current_Date.getMonth(), current_Date.getDate() + 1);
                
                // Calculate the total number of milliseconds in the day
                const total_Time = endOf_Day.getTime() - startOf_Day.getTime();
                
                // Calculate the number of milliseconds elapsed from the start of the day to the current time
                const elapsed_Time = current_Date.getTime() - startOf_Day.getTime();
                    
                // Calculate the percentage of the day that has passed
                const percentage_1 = (elapsed_Time / total_Time) * 100;
                    
                    // Round the percentage to two decimal places
                    const rounded_Percentage = percentage_1.toFixed(5);
                    
                    // Output the result
                    //console.log(`Current day progress: ${roundedPercentage}%`);
                    ProgressofDay.style.width=rounded_Percentage + "%"
                    DayPerentage.innerHTML= rounded_Percentage+ "%"; 
                    CheckColours(rounded_Percentage); 
                    
                    
                    
                    
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
                     checkColors(RealTimePercentage); 
                     
                     //let ActualProgressYears= (ruunningSecs/totalSecsYears) *1;
                     //console.log(ActualProgressYears);  
                     
                     var icon= document.getElementById("icons"); 
                     icon.onclick=function(){ 
                        document.body.classList.toggle("dark-theme");
                        if(document.body.classList.contains("dark-theme")){ 
                            icon.src="sun.png"; 
                            
                        }else
                            { 
                                icon.src="moon.png"; 
                            }
                         
                     }   
                    }, 500);          
                    
                    
                    
                    const checkColors = (width)=> { 
                        if (width> 50 && width<80){ 
                            progressBar.style.background= "yellow"; 
                            
                        }else if (width>80 )
                        {
                            progressBar.style.background= "red"; 
                        }
                        
                    }

            const CheckColours = (width1)=> { 
                if (width1> 50 && width1<80){ 
                    ProgressofDay.style.background= "yellow"; 
            
                }else if (width1>80 )
                {
                    ProgressofDay.style.background= "red"; 
                    
                }
        } 
