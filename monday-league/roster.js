import {applySuppliedEnteringAverages} from './bowler-averages.js';
// Demo roster: made-up teams and bowlers.
// Team numbers and displayed order preserved; missing averages supplemented below.
// Four blank/open positions are vacancies, not inferred people.
export const CONFIRMED_ROSTER=[
 [
  "Lane Changers",
  "Alex Sample",
  "Cameron Draftly",
  "Drew Sample",
  "Riley Proto",
  "Toby Stubbs"
 ],
 [
  "Pin Pals",
  "Ray Mockery",
  "Morgan Standin",
  "Pat Fakely",
  "Jesse Mockford",
  "Ray Fixture"
 ],
 [
  "Split Happens",
  "Toby Standin",
  "Hayden Placeholder",
  "Kendall Tester",
  "Morgan Sample",
  "Parker Tester"
 ],
 [
  "Gutter Guys",
  "Mitch Fixture",
  "Jordan Tester",
  "Mitch Draftly",
  "Parker Placeholder",
  "Luis Placeholder"
 ],
 [
  "Strike Force",
  "Eli Proto",
  "Toby Dummyson",
  "Joel Sandbox",
  "Hayden Dummyson",
  "Wes Simms"
 ],
 [
  "Alley Cats",
  "Kendall Dummyson",
  "Drew Lorem",
  "Jamie Sandbox",
  "Lance Placeholder",
  "Ray Proto"
 ],
 [
  "Ten Pin Titans",
  "Dale Dummyson",
  "Eli Dummyson",
  "Morgan Example",
  "Luis Rehearse",
  "Blake Lorem"
 ],
 [
  "Spare Me",
  "Reese Sample",
  "Jamie Rehearse",
  "Wes Mockford",
  "Blake Rehearse",
  "Jordan Ipsum"
 ],
 [
  "The Kingpins",
  "Reese Lorem",
  "Hank Stubbs",
  "Mitch Rehearse",
  "Joel Demo",
  "Casey Standin"
 ],
 [
  "Rolling Thunder",
  "Shawn Stubbs",
  "Rowan Dummyson",
  "Jamie Draftly",
  "Reese Ditto",
  "Toby Tester"
 ],
 [
  "Pocket Rockets",
  "Hayden Mockford",
  "Kendall Ditto",
  "Quinn Stubbs",
  "Hank Fakely",
  "Gabe Stubbs"
 ],
 [
  "Hook Line",
  "Reese Placeholder",
  "Nico Ipsum",
  "Jesse Simms",
  "Riley Pretendo",
  "Casey Fixture"
 ],
 [
  "Back Enders",
  "Parker Fixture",
  "Sam Pretendo",
  "Dana Simms",
  "Kendall Sandbox",
  "Dale Mockery"
 ],
 [
  "Brooklyn Bombers",
  "Rowan Placeholder",
  "Blake Demo",
  "Parker Simms",
  "Toby Placeholder",
  "Drew Simms"
 ],
 [
  "Carry Nation",
  "Luis Notreal",
  "Nico Tester",
  "Kurt Proto",
  "Logan Stubbs",
  "Lance Simms"
 ],
 [
  "Double Wood",
  "Owen Simms",
  "Hank Sandbox",
  "Nico Ditto",
  "Ray Notreal",
  "Luis Demo"
 ],
 [
  "Foul Line",
  "Alex Placeholder",
  "Morgan Ditto",
  "Wes Placeholder",
  "Ray Tester",
  "Alex Stubbs"
 ],
 [
  "Head Pins",
  "Jordan Placeholder",
  null,
  "Toby Demo",
  "Joel Mockery",
  "Wes Ipsum"
 ],
 [
  "Sour Apples",
  "Gabe Standin",
  "Vic Sandbox",
  "Ray Standin",
  "Cameron Proto",
  "Kurt Draftly"
 ],
 [
  "Washouts",
  "Morgan Simms",
  "Vic Mockford",
  null,
  null,
  null
 ]
];
export function loadConfirmedRoster(state){
 if(state.results.length||state.teams.length||state.bowlers.length)throw Error('Load the confirmed roster only into an empty workspace.');
 const next=structuredClone(state);
 for(const [i,row] of CONFIRMED_ROSTER.entries()){
  const team=i+1,players=[];
  row.slice(1).forEach((name,slot)=>{
   const id='monday-'+String(team).padStart(2,'0')+'-'+(slot+1);
   players.push(id);next.bowlers.push({id,name:name||'Vacancy — Team '+team+' slot '+(slot+1),team,entering:null,vacancy:name===null,history:[]});
  });
  next.teams.push({number:team,name:row[0],division:'',players});
 }
 next.sourceNotes=['Demo league: every team and bowler name is made up.'];
 return applySuppliedEnteringAverages(addConfirmedWeekOne(next)).state;
}

export function addConfirmedWeekOne(state){
 if(state.schedule.some(s=>s.week===1)||state.results.some(r=>r.week===1))throw Error('Week 1 already has a schedule or results; existing data has been preserved.');
 if(state.teams.length!==20||!Array.from({length:20},(_,i)=>i+1).every(n=>state.teams.some(t=>t.number===n)))throw Error('Week 1 confirmation requires the 20 numbered teams.');
 const next=structuredClone(state);
 next.schedule.push({week:1,kind:'regular',pairs:Array.from({length:10},(_,i)=>[2*i+1,2*i+2]),lanes:Array(10).fill(null)});
 next.schedule.sort((a,b)=>a.week-b.week);
 return next;
}
