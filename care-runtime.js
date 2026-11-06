import {getSettings,getPregnancyData,getCarrier,isTracked,getCurrentChatId} from './state.js';
import {care,screen,chooseDiagnoses,resolveDiagnoses,changeLoad,completeCare,profile,phase,carePrompt,trimester} from './reproductive-engine.js';
import {getPostpartum} from './pregnancy.js';
import {showNotification} from './notifications.js';
import {esc} from './helpers.js';

// Outside rollback snapshots: the same pregnancy and event reuse the same draws.
function stableRandom(c,who,key) {
    const s=getSettings();
    s._careRolls ||= {};
    const id=JSON.stringify([getCurrentChatId(),who,c._pregnancySequence||0,key]);
    if(!Object.hasOwn(s._careRolls,id) && !c._pregnancySequence) {
        // Upgrade the 4.0 ledger without rerolling an existing pregnancy.
        for(const date of [c.conceptionDate||'unanchored','unanchored']) {
            const legacy=JSON.stringify([getCurrentChatId(),who,date,key]);
            if(Array.isArray(s._careRolls[legacy])) {s._careRolls[id]=[...s._careRolls[legacy]];break;}
        }
    }
    const rolls=s._careRolls[id] ||= [];
    let i=0;
    return ()=>{if(rolls[i]===undefined)rolls[i]=Math.random();return rolls[i++];};
}
export function performScreen(c,s,who) {
    const changed=screen(c,s,who,stableRandom(c,who,'screen:'+trimester(c,s)));
    const a=care(c), rpDate=getPregnancyData().rpDate;
    if(changed && rpDate && a.nextVisit && new Date(rpDate)>=new Date(a.nextVisit))a.nextVisit='';
    return changed;
}
export function completeCareEvent(c,s,who) {
    if(!completeCare(c))return false;
    if(!c.isPregnant) {
        const pos=globalThis.SillyTavern?.getContext?.().chat?.length||0;
        const suffix=who==='char'?'Char':'User';
        s['_conceptionBlockedUntil'+suffix]=pos+6;
        s['_birthBlockedUntil'+suffix]=pos+10;
    }
    return true;
}
const LOAD_EVENTS={
    stress:[12,'Стресс'],illness:[15,'Болезнь'],starvation:[15,'Недостаточное питание'],
    injury:[25,'Травма'],exhaustion:[10,'Переутомление'],rest:[-10,'Отдых'],nutrition:[-5,'Питание'],
};
export function processCareStatus(s,p,data) {
    if(!s.isEnabled || !data || typeof data!=='object')return;
    const pos=globalThis.SillyTavern?.getContext?.().chat?.length||0;
    for(const who of ['user','char']) {
        if(!isTracked(who))continue;
        const c=getCarrier(who), fact=(who==='user'?data:data.partner)?.care;
        if(!fact || typeof fact!=='object' || Array.isArray(fact) || !c.isPregnant)continue;
        const a=care(c), crisisAtStart=a.event;
        if(a.maternalDeath)continue;
        let changed=false;
        if(s.maternalMortality && fact.maternal_death_confirmed===true) {
            a.maternalDeath=true;a.result='Гибель вынашивающего персонажа подтверждена в сюжете.';changed=true;
        } else if(crisisAtStart) {
            if(fact.loss_form==='frozen' && a.event==='loss') {
                a.event='frozen';a.result='Беременность замерла, плод погиб.';changed=true;
            }
            // A model cannot know the newly rolled outcome in the same reply.
            const canComplete=a.eventPosition===undefined || pos>a.eventPosition;
            if(canComplete && ((fact.help_completed===true && a.event==='rescue') || (fact.loss_completed===true && ['loss','frozen'].includes(a.event)))) {
                changed=completeCareEvent(c,s,who)||changed;
            }
        } else {
            changed=chooseDiagnoses(c,s,who,fact.diagnoses)||changed;
            changed=resolveDiagnoses(c,fact.resolved)||changed;
            const eventKey='load:'+pos;
            if(!a.processed.includes(eventKey) && Object.hasOwn(LOAD_EVENTS,fact.event)) {
                const [amount,label]=LOAD_EVENTS[fact.event];
                if(changeLoad(c,amount,label,stableRandom(c,who,eventKey))) {
                    a.processed.push(eventKey);changed=true;
                    if(a.event)a.eventPosition=pos;
                }
            }
            if(fact.screening===true)changed=performScreen(c,s,who)||changed;
        }
        if(changed && s.showNotifications && a.result)showNotification(esc(a.result),a.event||a.maternalDeath?'warning':'info');
    }
}
export function runtimePrompt(s,p) {
    const lines=[], normal=[], rescue=[], loss=[], refinable=[], resolvable=[];
    for(const who of ['user','char']) {
        if(!isTracked(who))continue;
        const c=getCarrier(who), cfg=profile(s,who), a=care(c), target=who==='user'?'care':'partner.care';
        const state=carePrompt(c,s,who);
        if(state)lines.push(state);
        if(a.maternalDeath)continue;
        if(c.isPregnant) {
            if(a.event==='rescue')rescue.push(target);
            else if(['loss','frozen'].includes(a.event)) {loss.push(target);if(a.event==='loss')refinable.push(target);}
            else normal.push(target);
            const diagnoses=(c.complications||[]).filter(x=>!x.resolved).map(x=>({id:x.id||x.type,name:x.type}));
            if(diagnoses.length)resolvable.push(`${target}: ${JSON.stringify(diagnoses)}`);
            if(a.nextVisit && p.rpDate && new Date(p.rpDate)>=new Date(a.nextVisit))lines.push(`${who}: наступила назначенная дата приёма.`);
            continue;
        }
        const pp=getPostpartum(c,p);
        if(pp && !pp.cycleReturned)continue;
        const ph=phase(s,who,c.cycleDay||1,p.rpDate);
        for(const kind of ['heat','rut']) {
            if(ph[kind]===null)lines.push(`${who}: ${kind} не определён без корректной сезонной и сюжетной даты.`);
            if(ph[kind] && cfg[kind].tags.length)lines.push(`${who}, ${kind}: ${JSON.stringify(cfg[kind].tags)}. Используй 1–2 подходящих проявления, чередуй их.`);
        }
    }
    if(normal.length)lines.push(`RP_STATUS ${normal.join(' / ')}: event=stress|illness|starvation|injury|exhaustion|rest|nutrition только для нового события; screening:true только после состоявшегося обследования. Не повторяй event для продолжающегося состояния.`);
    if(rescue.length)lines.push(`В RP_STATUS ${rescue.join(', ')}: help_completed:true только после завершённой помощи для сохранения беременности.`);
    if(loss.length)lines.push(`В RP_STATUS ${loss.join(', ')}: loss_completed:true только после физического завершения события потери.`);
    if(refinable.length)lines.push(`В RP_STATUS ${refinable.join(', ')}: loss_form:"frozen" допускается для уточнения уже подтверждённой потери как замирания.`);
    if(resolvable.length)lines.push(`Активные диагнозы: ${resolvable.join('; ')}. resolved:[ID] только при установленном в сцене выздоровлении.`);
    if(normal.length||rescue.length||loss.length) {
        lines.push('Исходы и число осложнений определяет трекер; не создавай независимых случайных потерь или диагнозов.');
        if(s.maternalMortality)lines.push('care.maternal_death_confirmed:true (partner.care для char) только при уже установленной в сюжете гибели; без нового броска.');
    }
    return lines.length?lines.join('\n')+'\n':'';
}
