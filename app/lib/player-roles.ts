export type PlayerRoleGroup="GK"|"CB"|"FB_WB"|"DM"|"CM"|"AM"|"WINGER"|"ST_CF"|"FIELD";

export function getPlayerRoleGroup(position:string|null,secondaryPosition:string|null=null):PlayerRoleGroup{
 const value=`${position||""} ${secondaryPosition||""}`.toLowerCase();
 if(/goalkeeper|goalie|(^|\\W)gk($|\\W)/i.test(value)) return "GK";
 if(/center back|centre back|central defender|center defender|centre defender|\\bcb\\b/i.test(value)) return "CB";
 if(/full.?back|fullback|wing.?back|left back|right back|\\blb\\b|\\brb\\b|\\blwb\\b|\\brwb\\b/i.test(value)) return "FB_WB";
 if(/defensive midfield|holding midfield|\\bdm\\b/i.test(value)) return "DM";
 if(/attacking midfield|\\bam\\b|number 10|no\\.? ?10/i.test(value)) return "AM";
 if(/central midfield|centre midfield|center midfield|\\bcm\\b/i.test(value)) return "CM";
 if(/winger|left wing|right wing|wide forward|\\blw\\b|\\brw\\b/i.test(value)) return "WINGER";
 if(/striker|center forward|centre forward|forward|\\bcf\\b|\\bst\\b/i.test(value)) return "ST_CF";
 return "FIELD";
}

export const roleLabels:Record<PlayerRoleGroup,string>={
 GK:"Goalkeeper",
 CB:"Center Back",
 FB_WB:"Full Back / Wing Back",
 DM:"Defensive Midfielder",
 CM:"Central Midfielder",
 AM:"Attacking Midfielder",
 WINGER:"Winger",
 ST_CF:"Striker / Center Forward",
 FIELD:"Field Player"
};
