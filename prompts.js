import {cycleLength,profile,phase,care,termInfo,conceptionChance} from './reproductive-engine.js';
import {runtimePrompt} from './care-runtime.js';
import {reportError} from './diagnostics.js';
import {setExtensionPrompt,extension_prompts,extension_prompt_types,extension_prompt_roles} from '../../../../script.js';
import {extensionName} from './config.js';
import {getSettings,getPregnancyData,getPartnerData,getCycleDay,isTracked,getContraception} from './state.js';
import {canCarry,hasCycle} from './omegaverse.js';
import {pregnancyIsKnown,getPostpartum,monthsTrying} from './pregnancy.js';
import {conceptionStruggle} from './fertility.js';
import {detectChatLanguage} from './helpers.js';
import {babyAgeDays} from './baby-care.js';

function languageRule() {
    const lang=detectChatLanguage()==='ru'?'Russian':'English';
    return `Descriptive strings in RP_STATUS: ${lang}, concise scene facts; omit unknown values. Keep JSON keys, IDs, enum values, numbers and booleans unchanged.\n`;
}
function carrierCycleLine(who,s,p) {
    const c=who==='user'?p:getPartnerData(), cfg=profile(s,who), a=care(c);
    const details=[];
    if(cfg.race)details.push('species='+JSON.stringify(cfg.race));
    if(cfg.health)details.push('known health='+JSON.stringify(cfg.health));
    if(!c.isPregnant && !a.maternalDeath) {
        const pp=getPostpartum(c,p);
        if(pp && !pp.cycleReturned)details.push('postpartum; cycle paused');
        else {
            const day=who==='user'?getCycleDay():c.cycleDay||1;
            // Menstrual and PMS phases are informational UI hints only. Never
            // instruct the model to infer a person's mood, libido or bodily sensations.
            // Keep the neutral cycle counter: conception calculations use it.
            const ph=phase(s,who,day,p.rpDate,'en');
            const cycle=hasCycle(s,who)?`cycle day ${day}/${cycleLength(s,who)}`:'';
            const special=[ph.heat?'Heat':null,ph.rut?'Rut':null].filter(Boolean).join(', ');
            if(cycle || special)details.push([cycle,special].filter(Boolean).join('; '));
        }
    }
    return details.length?`${who}: ${details.join('; ')}.\n`:'';
}
export function getBasePrompt() {
    const s=getSettings(), p=getPregnancyData();
    if(!s.isEnabled)return '';
    const active=['user','char'].filter(isTracked);
    if(!active.length && !p.hasBaby)return '';
    let b=`[REPRODUCTIVE] user={{user}}; char={{char}}. Tracking: ${active.join(', ')||'none'}. Can carry: ${active.filter(w=>canCarry(s,w)).join(', ')||'none'}.\n`;
    b+='RP_STATUS root concerns user; partner concerns char. Tracker state is private until observed, disclosed, examined or detectable by established abilities. Do not decide the player’s actions or feelings.\n';
    if (p.narratorMode) {
        const parts = (p.narratorParticipants || []).slice(0,20).map(x =>
            ({name:String(x.name||'').slice(0,80),role:x.role})).filter(x=>x.name && ['carry','fertilize','both','none'].includes(x.role));
        b+=`Narrator card: multiple named NPCs may share {{char}}. Registered roles=${JSON.stringify(parts)}. Do not assume all NPCs share physiology or parentage; attribute events only to explicitly named participants. DNA parentage is unknown until confirmed by a narrated test or a recorded manual fact.\n`;
    }

    if(p.rpDate)b+=`RP time: ${new Date(p.rpDate).toLocaleString('en-GB',{hour12:false})}. Advance only with elapsed story time.\n`;
    b+=active.map(w=>carrierCycleLine(w,s,p)).join('');
    b+=runtimePrompt(s,p);
    // A disruption marker can report an explicit severe scene event to the engine,
    // not a phase-based feeling or automatic menstrual behaviour.
    if(s.realism && active.includes('user') && !p.isPregnant && hasCycle(s,'user'))
        b+='RP_STATUS cycle_event=stress|illness|starvation|travel|overtrain only if a new severe event was already established in this scene. No inferred symptoms or moods.\n';
    for(const who of active) {
        const c=who==='user'?p:getPartnerData();
        if(c.isPregnant || care(c).maternalDeath || !canCarry(s,who))continue;
        const suffix=who==='char'?':CHAR':'';
        b+=`${who}: protection=${getContraception(who)}. Actual internal semen release into this carrier now: <!-- [CONCEPTION_CHECK${suffix}] -->. Exclude external/oral release, withdrawal, memories, plans and intact condoms. The tracker handles conception.\n`;
    }
    if(active.includes('char'))b+=compactPregnancy('char',s);
    if(active.includes('user') && s.tryingToConceive && !p.isPregnant && !care(p).maternalDeath)b+=tryingBlock(s,p);
    const fields=c=>care(c).maternalDeath || care(c).event?{note:''}:c.isPregnant&&pregnancyIsKnown(c,s)?{mood:'',symptoms:'',fetus_size:'',note:''}:{note:''};
    const status={subject:'user',...(active.includes('user')?fields(p):{})};
    if(active.includes('char'))status.partner={subject:'char',...fields(getPartnerData())};
    if(p.hasBaby)status.babies=p.babies.map((c,i)=>({label:c.name||`Baby${i+1}`,mood:'',sleep:'',feeding:'',diaper:'',care_note:''}));
    b+=`One hidden status comment at the end: <!-- [RP_STATUS:${JSON.stringify(status)}] -->. Add event fields only when applicable.\n`;
    b+=languageRule();
    if(p.hasBaby)b+='Baby labels are stable identifiers; milestone only for a new first achievement in this scene.\n';
    b+='Last line: <!-- [RP_DATE:DD.MM.YYYY HH:MM] --> for current story time. Markers only in HTML comments in the final reply.\n';
    return b;
}
function compactPregnancy(who,s) {
    const p=getPregnancyData(), c=who==='user'?p:getPartnerData(), a=care(c);
    if(!isTracked(who) || !c.isPregnant || a.maternalDeath || ['loss','frozen'].includes(a.event))return '';
    const known=pregnancyIsKnown(c,s), name=who==='user'?'{{user}}':'{{char}}', suffix=who==='char'?':CHAR':'';
    const {weeks}=termInfo(c,p.rpDate), duration=s.pregnancyDuration||40, pct=Math.round(weeks/duration*100);
    const sex=c.fetusSexRevealed?(c.fetusSex||[]).join(', '):'unknown';
    let b=`${name}: pregnant, ${weeks}/${duration} weeks (${pct}% of term); fetuses=${c.fetusCount||1}; sex=${sex}; discovery=${known?'recorded':'not recorded'}. Cycle paused.\n`;
    if(c.fatherName)b+=`${who}: second parent=${JSON.stringify(c.fatherName)}.\n`;
    if(!a.event) {
        if(duration!==40)b+=`Development follows ${pct}% of the configured full term.\n`;
        b+=`${who}: confirmed discovery -> ${who==='user'?'RP_STATUS':'RP_STATUS partner'}.pregnancy_known:true; actual test -> test_result:positive|faint|negative. An examination confirming a different fetal count -> fetus_count:1–4 and fetus_count_confirmed:true. Preserve unconfirmed tracker values.\n`;
        if(weeks>=duration)b+=`Completed delivery only: <!-- [BIRTH${suffix}] --> and <!-- [BABY_TRAITS:{"babies":[{"name":"","fatherName":"","personality":[],"appearance":[]}]}] -->. Term alone does not imply delivery. Use established appearance only; unknown traits stay empty.\n`;
        if(!c.fetusSexRevealed)b+=`Confirmed sex reveal: <!-- [SEX_REVEAL${suffix}] -->.\n`;
        if(who==='user')b+='Completed intentional termination only: <!-- [ABORTION] -->; never a plan or a loss scare.\n';
    }
    return b;
}
export function getPregnancyPrompt() {
    const s=getSettings(), p=getPregnancyData();
    if(!s.isEnabled)return '';
    let b=compactPregnancy('user',s);
    for(const who of ['user','char'])if(isTracked(who))b+=postpartumBlock(who,p);
    if(p.hasBaby)b+=compactFamily(p)+birthdayBlock(p);
    else if(p.grownChildren?.length)b+=olderChildren(p);
    return b;
}
function tryingBlock(s,p) {
    const partner=getPartnerData();
    const chance=conceptionChance(s,'user',getCycleDay(),p.rpDate,partner.cycleDay||1,!partner.isPregnant);
    const months=monthsTrying(p), concern=conceptionStruggle(months);
    return `Trying to conceive: recorded. Current unprotected game chance: ${chance}%.${months?' Duration: '+months+' story months.':''}${concern?' '+concern.label+'.':''}\n`;
}
function postpartumBlock(who,p) {
    const c=who==='user'?p:getPartnerData();
    if(c.isPregnant || care(c).maternalDeath)return '';
    const pp=getPostpartum(c,p);
    if(!pp)return '';
    return `${who}: ${pp.days} days postpartum; ${pp.lactating?'lactating':'not lactating'}; cycle ${pp.cycleReturned?'returned':'not returned'}${pp.healing?'; recovery='+pp.healing:''}${pp.lochia?'; lochia':''}.\n`;
}
function olderChildren(p) {
    return 'Older children: '+p.grownChildren.map(c=>`${JSON.stringify(c.name||'unnamed')}, age=${babyAgeDays(c,p)??'?'} story days`).join('; ')+'.\n';
}
function compactFamily(p) {
    let b='[CHILDREN]\n';
    for(const [i,c] of (p.babies||[]).entries()) {
        const values={age_days:babyAgeDays(c,p)};
        for(const [key,value] of Object.entries({health:c.health,mood:c.mood,sleep:c.sleep,feeding:c.feedingType,care:c.careNote}))if(value)values[key]=value;
        if(c.diaperStatus)values.diaper=c.diaperStatus;
        if(c.personality?.length)values.personality=c.personality;
        if(c.appearance?.length)values.appearance=c.appearance;
        const recent=(c.milestones||[]).slice(-3).map(x=>x.text).filter(Boolean);
        if(recent.length)values.achieved=recent;
        b+=`${JSON.stringify(c.name||`Baby${i+1}`)}: ${JSON.stringify(values)}.\n`;
    }
    if(p.grownChildren?.length)b+=olderChildren(p);
    return b;
}
function birthdayBlock(p) {
    if(!p.rpDate)return '';
    const now=new Date(p.rpDate);
    if(!Number.isFinite(+now))return '';
    const lines=[];
    for(const c of [...(p.babies||[]),...(p.grownChildren||[])]) {
        const birth=new Date(c.birthRpDate);
        if(!c.birthRpDate || !Number.isFinite(+birth))continue;
        const years=now.getFullYear()-birth.getFullYear();
        if(years>=1 && now.getDate()===birth.getDate() && now.getMonth()===birth.getMonth())lines.push(`${JSON.stringify(c.name||'Child')}: birthday today, ${years}.`);
    }
    return lines.length?lines.join('\n')+'\n':'';
}

let legacySlotsCleared = false;
export function updatePromptInjection() {
    try {
        if (!legacySlotsCleared) {
            setExtensionPrompt(extensionName + '_sys', '', extension_prompt_types.IN_PROMPT, 0);
            setExtensionPrompt(extensionName + '_scan', '', extension_prompt_types.IN_PROMPT, 0);
            legacySlotsCleared = true;
        }
        const core = getBasePrompt() + getPregnancyPrompt();
        // SillyTavern replaces this registry on clearChat(). A local text cache
        // cannot tell whether our instruction is still installed in the host.
        const installed = extension_prompts[extensionName];
        if (installed?.value === core
            && installed.position === extension_prompt_types.IN_CHAT
            && installed.depth === 0
            && installed.role === extension_prompt_roles.SYSTEM) return;
        setExtensionPrompt(extensionName, core, extension_prompt_types.IN_CHAT, 0, false, extension_prompt_roles.SYSTEM);
    } catch (error) {
        reportError('[Reproductive] updatePromptInjection error:', error);
    }
}

