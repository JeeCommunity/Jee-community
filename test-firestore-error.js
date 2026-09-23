const Ka = function(){ this.src = null; }; 
const Y2 = function(){ this.i = new Ka(); this.i.src = this; }; 
const y = new Y2(); 
try {
  // If Firestore logs it, it might throw here
  console.log("Data: " + JSON.stringify(y));
} catch (e) {
  console.error(e.message);
}
