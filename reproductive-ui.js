import {refreshRegenSnapshot} from './message-handler.js';
import {performScreen,completeCareEvent} from './care-runtime.js';
import {profile,care,changeLoad,catalog,customComplicationId,termInfo} from './reproductive-engine.js';
import {getSettings,getPregnancyData,getCarrier,carrierName} from './state.js';
import {saveSettingsDebounced} from '../../../../script.js';
import {syncUI} from './ui.js';
import {updatePromptInjection} from './prompts.js';
import {esc} from './helpers.js';
const symbols={heat:'✦',rut:'◇'};
const options=(values,value)=>values.map(([v,t])=>`<option value="${v}" ${String(v)===String(value)?'selected':''}>${t}</option>`).join('');
const field=(name,label,value,type='text',attrs='')=>`<label class="rp-field"><span>${label}</span><input data-field="${name}" type="${type}" value="${esc(String(value??'')).replaceAll('"','&quot;')}" ${attrs}></label>`;
const select=(name,label,value,values)=>`<label class="rp-field"><span>${label}</span><select data-field="${name}">${options(values,value)}</select></label>`;
const check=(name,label,value)=>`<label class="rp-check"><input type="checkbox" data-field="${name}" ${value?'checked':''}><span>${label}</span></label>`;
export function settingsMarkup(s,c,who='user',names=['Персона','Персонаж']) {
    const p=profile(s,who), a=care(c);
    const period=(kind,title)=>{const v=p[kind];return `<details class="rp-paper"><summary><span aria-hidden="true">${symbols[kind]}</span> ${title}</summary><div class="rp-section-body">
        ${check(kind+'.enabled','Включено',v.enabled || kind==='heat'&&p.cycleType==='heat')}
        ${select(kind+'.mode','Когда начинается',v.mode,[['cycle','По дням цикла'],['seasonal','Сезонно — по РП-календарю']])}
        ${field(kind+'.start','Первый день цикла',v.start,'number',`min="1" max="${p.cycleLength}" ${v.mode==='seasonal'||p.cycleType==='none'?'disabled':''}`)}
        ${field(kind+'.date','Дата начала сезона (ММ-ДД)',v.date,'text',`placeholder="03-01" pattern="[0-9]{2}-[0-9]{2}" ${v.mode!=='seasonal'?'disabled':''}`)}
        ${field(kind+'.duration','Длительность · сюжетные дни',v.duration,'number',`min="1" max="${v.mode==='seasonal'?364:p.cycleLength-1}"`)}
        <div class="rp-presets" data-preset="${kind}">${[1,3,7,30].map(n=>`<button type="button" data-days="${n}">${n} дн.</button>`).join('')}</div>
        <p class="rp-hint">Между периодами — минимум один день. Сезонный период ждёт сюжетную дату; реальные паузы ничего не меняют.</p>
        ${kind==='rut'?select('rut.chanceMode','Как гон влияет на зачатие',v.chanceMode,[['multiply','Множитель'],['fixed','Фиксированный шанс']])+field('rut.multiplier','Множитель',v.multiplier,'number',`min="0" max="100" step="0.1" ${v.chanceMode!=='multiply'?'disabled':''}`):''}
        ${field(kind+'.chance',kind==='rut'?'Фиксированный шанс · %':'Шанс во время течки · %',v.chance,'number',`min="0" max="100" ${kind==='rut'&&v.chanceMode!=='fixed'?'disabled':''}`)}
        ${kind==='heat'?field('heat.outside','Шанс вне течки · %',v.outside,'number','min="0" max="100"')+'<div class="rp-presets" data-outside><button type="button" data-chance="0">0 %</button><button type="button" data-chance="5">5 %</button></div>':''}
        <fieldset class="rp-tags"><legend>Проявления</legend>${['Жар','Чувствительность','Беспокойство','Потребность в близости','Изменение запаха'].map(t=>`<label class="rp-check"><input data-tag="${kind}" value="${t}" type="checkbox" ${v.tags.some(x=>x.name===t&&x.description===t)?'checked':''}>${t}</label>`).join('')}</fieldset>
        <div class="rp-builder">
            <div class="rp-builder-title">Добавить своё проявление</div>
            <input type="text" data-new-tag-name="${kind}" maxlength="80" placeholder="Название: например, жар" aria-label="Название нового проявления">
            <input type="text" data-new-tag-description="${kind}" maxlength="240" placeholder="Как выглядит в сцене: кожа теплее обычного" aria-label="Описание нового проявления">
            <button type="button" data-add-tag="${kind}">＋ Добавить проявление</button>
            <div class="rp-custom-list">${v.tags.map((t,i)=>({t,i})).filter(({t})=>!['Жар','Чувствительность','Беспокойство','Потребность в близости','Изменение запаха'].includes(t.name)||t.description!==t.name).map(({t,i})=>`<div class="rp-custom-row"><span><b>${esc(t.name)}</b> · ${esc(t.description)}</span><button type="button" data-remove-tag="${kind}" data-tag-index="${i}" aria-label="Удалить проявление ${esc(t.name)}">×</button></div>`).join('')}</div>
            <p class="rp-editor-feedback" data-feedback="${kind}" role="status"></p>
        </div>
        <details class="rp-raw-editor"><summary>Расширенный текстовый ввод</summary>
            <label class="rp-field"><span>Одна запись на строку. Пример: Жар | кожа становится горячей</span><textarea data-custom-tags="${kind}" rows="3">${esc(v.tags.filter(t=>!['Жар','Чувствительность','Беспокойство','Потребность в близости','Изменение запаха'].includes(t.name)||t.description!==t.name).map(t=>t.name+' | '+t.description).join('\n'))}</textarea></label>
        </details>
        <p class="rp-hint" data-tag-warning="${kind}">${v.tags.length>5?'Больше пяти проявлений: часть может теряться в отыгрыше.':'Модель использует 1–2 проявления по ситуации.'}</p>
    </div></details>`;};
    return `<div class="rp-editor-head"><div><p class="rp-eyebrow">REPRODUCTIVE · 4.0.2</p><h2>Особенности персонажей</h2><p>Здесь задаются правила организма. Это не заменяет факты и решения персонажей.</p></div><button type="button" data-close aria-label="Закрыть настройки">×</button></div>
    <nav class="rp-persons" aria-label="Настройки участника">${names.map((n,i)=>`<button type="button" data-who="${i?'char':'user'}" aria-pressed="${who===(i?'char':'user')}">${i?'◇':'○'} ${esc(n)}</button>`).join('')}</nav>
    <details class="rp-editor-guide"><summary>Нужна помощь с настройкой?</summary>
        <p>Сначала выбери участника сверху и укажи тип цикла. Стандартные значения можно не менять. Течка, гон, осложнения и их вероятности — дополнительные возможности для особых сюжетов.</p>
        <p>Наведи указатель на поле или сфокусируй его клавиатурой, чтобы увидеть объяснение. Все изменения сохраняются автоматически.</p>
    </details>
    <div class="rp-editor-grid"><div class="rp-editor-main">
    <section class="rp-paper"><h3><span aria-hidden="true">◷</span> Организм и цикл</h3><div class="rp-section-body">
    ${field('race','Вид персонажа',p.race,'text','placeholder="Например, человек"')}
    ${select('reproductiveRole','Участие в зачатии',p.reproductiveRole,[['auto','По настройкам вынашивания'],['carry','Только вынашивает'],['fertilize','Только оплодотворяет'],['both','Может и вынашивать, и оплодотворять'],['none','Не участвует в зачатии']])}
    ${select('cycleType','Как устроен цикл?',p.cycleType,[['menstrual','С менструацией'],['silent','Без кровотечения'],['heat','С течкой'],['none','Без цикла']])}
    ${field('cycleLength','Длительность цикла (дней в сюжете)',p.cycleLength,'number',`min="2" max="10000" ${p.cycleType==='none'?'disabled':''}`)}
    <div class="rp-presets" data-cycle>${[21,28,30,35].map(n=>`<button type="button" data-days="${n}">${n} дн.</button>`).join('')}</div>
    ${field('periodDays','Продолжительность кровотечения',p.periodDays,'number',`min="0" max="${p.cycleLength-1}" ${p.cycleType!=='menstrual'?'disabled':''}`)}
    ${check('compatible','Зачатие между участниками возможно',p.compatible)}
    <label class="rp-field"><span>Известное о здоровье</span><textarea data-field="health" rows="3" placeholder="Только известное по сюжету">${esc(p.health)}</textarea></label>
    </div></section>${period('heat','Течка')}${period('rut','Гон')}
    <details class="rp-paper"><summary>＋ Возможные осложнения</summary><div class="rp-section-body">
    ${check('humanComplications','Разрешить стандартные осложнения',p.humanComplications)}
    <p class="rp-hint">Список вариантов не ограничен. До трёх новых осложнений за триместр; выбор учитывает срок, расу и здоровье.</p>
    <div class="rp-builder">
        <div class="rp-builder-title">Добавить своё осложнение</div>
        <input type="text" data-new-comp-name maxlength="90" placeholder="Название: например, сильный токсикоз" aria-label="Название осложнения">
        <input type="text" data-new-comp-description maxlength="300" placeholder="Проявления: тошнота и слабость" aria-label="Проявления осложнения">
        <fieldset class="rp-builder-stages"><legend>В каких триместрах возможно?</legend>
            ${[1,2,3].map(n=>`<label><input type="checkbox" data-new-comp-stage value="${n}" checked> ${n}-й</label>`).join('')}
        </fieldset>
        <button type="button" data-add-complication>＋ Добавить осложнение</button>
        <div class="rp-custom-list">${p.customComplications.map((x,i)=>`<div class="rp-custom-row"><span><b>${esc(x.name)}</b> · ${esc(x.description)} · ${x.stages.join(',')} трим.</span><button type="button" data-remove-complication="${i}" aria-label="Удалить осложнение ${esc(x.name)}">×</button></div>`).join('')}</div>
        <p class="rp-editor-feedback" data-feedback="complication" role="status"></p>
    </div>
    <details class="rp-raw-editor"><summary>Расширенный текстовый ввод</summary><label class="rp-field"><span>Пример: Сильный токсикоз | тошнота | 1,2</span><textarea data-custom-complications rows="5" placeholder="Название | Проявления | 1,2,3">${esc(p.customComplications.map(x=>`${x.name} | ${x.description} | ${x.stages.join(',')}`).join('\n'))}</textarea></label></details>
    <details data-rp-catalog><summary>Стандартный список · ${catalog.length} варианта</summary><ul data-rp-catalog-list></ul></details>
    <details><summary>Шансы осложнений · для опытных</summary><p class="rp-hint">Игровые шансы, не медицинская статистика. Второй бросок только после первого успеха, третий — после второго.</p>${(s.complicationChances||[30,15,1]).map((v,i)=>field('chance'+i,`Осложнение ${i+1} · %`,v,'number','min="0" max="100"')).join('')}</details>
    </div></details></div>
    <aside class="rp-editor-aside"><section class="rp-paper"><h3>♡ Беременность</h3><div class="rp-section-body">
    <p class="rp-state">${esc(a.maternalDeath ? 'Гибель подтверждена' : c.isPregnant ? a.event==='frozen'?'Беременность замерла':a.event==='loss'?'Потеря подтверждена':'Беременность · '+(c.pregnancyWeeks||0)+' нед.' : 'Беременности нет')}</p>
    <label class="rp-field"><span>Нагрузка на организм · ${a.load} из 100${a.load>=70?' · риск высокий':''}</span><meter min="0" max="100" value="${a.load}" aria-label="Нагрузка">${a.load}</meter></label>
    <p class="rp-hint">${esc(a.result||'Состояние меняется по событиям в истории.')}</p>
    ${a.reasons.length?'<ul>'+a.reasons.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':''}
    <ul>${(c.complications||[]).filter(x=>!x.resolved).map(x=>`<li>${esc(x.type)}</li>`).join('')}</ul>
    ${field('nextVisit','Следующее обследование (дата в сюжете)',a.nextVisit,'date')}${field('doctor','Имя врача',a.doctor)}
    <button type="button" data-action="screen" ${!c.isPregnant||a.event||a.maternalDeath?'disabled':''}>＋ Отметить обследование</button>
    <p class="rp-hint">Нажимай после отыгранного обследования. Результат сохраняется; повторный осмотр его не перебрасывает.</p>
    ${a.event&&!a.maternalDeath?`<button type="button" data-action="complete">✓ ${a.event==='rescue'?'Помощь оказана':'Событие завершено'}</button>`:''}
    <details><summary>Изменить состояние вручную</summary><div class="rp-section-body">${check('maternalMortality','Допустить гибель вынашивающего персонажа',s.maternalMortality)}<p class="rp-hint">Трагический исход. Выключено по умолчанию; фиксируется только уже установленная по сюжету гибель, без отдельного случайного броска.</p>${field('load','Нагрузка',a.load,'number','min="0" max="100"')}<button type="button" data-action="load" ${!c.isPregnant||a.maternalDeath?'disabled':''}>Изменить нагрузку</button><button type="button" data-action="frozen" ${!c.isPregnant||a.maternalDeath?'disabled':''}>Отметить замершую беременность</button></div></details>
    </div></section><section class="rp-paper"><h3>≡ Отображение</h3><div class="rp-section-body">${select('readingSize','Размер текста расширения',s.readingSize||16,[[16,'Обычный · 16 px'],[18,'Крупный · 18 px'],[20,'Очень крупный · 20 px']])}<p class="rp-hint">Матовая поверхность, свободные интервалы и символы с подписями.</p><p role="status" class="rp-save-state">Изменения сохраняются автоматически</p></div></section></aside></div>`;
}
export function openReproductiveSettings(initialWho='user') {
    document.querySelector('#rp-profile-dialog')?.remove();
    const dialog=document.createElement('dialog');dialog.id='rp-profile-dialog';dialog.className='rp-profile-dialog';dialog.setAttribute('aria-label','Репродуктивные настройки');document.body.append(dialog);
    let who=initialWho;
    const refresh=()=>{dialog.innerHTML=settingsMarkup(getSettings(),getCarrier(who),who,[carrierName('user'),carrierName('char')]);document.documentElement.style.setProperty('--rp-reading-size',(getSettings().readingSize||16)+'px');};
    const persist=()=>{refreshRegenSnapshot();saveSettingsDebounced();syncUI();updatePromptInjection();};
    // Lazy-create the detailed complication catalog only when it is expanded.
    // The normal dialog opens quickly even when the player has a long history.
    dialog.addEventListener('toggle', e => {
        const details = e.target;
        if (!details?.matches?.('details[data-rp-catalog]') || !details.open || details.dataset.rendered) return;
        const list = details.querySelector('[data-rp-catalog-list]');
        if (!list) return;
        const disabled = profile(getSettings(),who).disabledComplications || [];
        const frag = document.createDocumentFragment();
        for (const x of catalog) {
            const li=document.createElement('li'), label=document.createElement('label'),input=document.createElement('input'),strong=document.createElement('strong');
            label.className='rp-check';input.type='checkbox';input.dataset.catalog=x.id;input.checked=!disabled.includes(x.id);
            strong.textContent=x.name;label.append(input,strong);
            li.append(label,document.createTextNode(` · ${x.stages.join(', ')} триместр`),document.createElement('br'),document.createTextNode(x.description));
            frag.append(li);
        }
        list.append(frag);
        details.dataset.rendered='true';
    }, true);
    dialog.addEventListener('click',e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.hasAttribute('data-close')){dialog.close();return;}
        if(b.dataset.who){who=b.dataset.who;refresh();return;}
        const s=getSettings();s.profiles||={user:profile(s,'user'),char:profile(s,'char')};const p=s.profiles[who];
        if(b.dataset.days){const k=b.parentElement.dataset.preset;if(k)p[k].duration=Math.min(+b.dataset.days,p[k].mode==='seasonal'?364:p.cycleLength-1);else p.cycleLength=+b.dataset.days;}
        if(b.dataset.chance)p.heat.outside=+b.dataset.chance;
        const c=getCarrier(who),a=care(c);
        // Structured editors generate the existing saved format; the raw editor remains available.
        const invalid=(key, message)=>{const field=dialog.querySelector(`[data-feedback="${key}"]`);if(field)field.textContent=message;};
        if(b.dataset.addTag) {
            const kind=b.dataset.addTag;
            const name=dialog.querySelector(`[data-new-tag-name="${kind}"]`)?.value.trim()||'';
            const description=dialog.querySelector(`[data-new-tag-description="${kind}"]`)?.value.trim()||'';
            if(!name){invalid(kind,'Введи название проявления. Например: Жар.');return;}
            if(p[kind].tags.some(t=>t.name===name && t.description===(description||name))){invalid(kind,'Это проявление уже существует.');return;}
            p[kind].tags.push({name,description:description||name});
            persist();refresh();return;
        }
        if(b.dataset.removeTag) {
            const kind=b.dataset.removeTag,index=Number(b.dataset.tagIndex);
            if(!Number.isInteger(index)||index<0||index>=p[kind].tags.length)return;
            p[kind].tags.splice(index,1);persist();refresh();return;
        }
        if(b.hasAttribute('data-add-complication')) {
            const name=dialog.querySelector('[data-new-comp-name]')?.value.trim()||'';
            const description=dialog.querySelector('[data-new-comp-description]')?.value.trim()||'';
            const stages=[...dialog.querySelectorAll('[data-new-comp-stage]:checked')].map(e=>Number(e.value));
            if(!name || !description || !stages.length){invalid('complication','Укажи название, проявления и хотя бы один триместр.');return;}
            if(p.customComplications.some(x=>x.name===name)){invalid('complication','Осложнение с таким названием уже есть.');return;}
            p.customComplications.push({id:customComplicationId(name),name,description,stages});
            persist();refresh();return;
        }
        if(b.hasAttribute('data-remove-complication')) {
            const index=Number(b.dataset.removeComplication);
            if(!Number.isInteger(index)||index<0||index>=p.customComplications.length)return;
            p.customComplications.splice(index,1);persist();refresh();return;
        }
        if(b.dataset.action==='screen')performScreen(c,s,who);
        if(b.dataset.action==='load')changeLoad(c,Number(dialog.querySelector('[data-field="load"]').value)-a.load,'Ручная настройка');
        if(b.dataset.action==='complete')completeCareEvent(c,s,who);
        if(b.dataset.action==='frozen'&&c.isPregnant&&!a.maternalDeath){
            if(!confirm('Отметить замершую беременность? Это зафиксирует гибель плода в текущей истории. Само событие не завершится, пока не будет завершено по сюжету.'))return;
            a.event='frozen';a.frozenWeeks=termInfo(c,getPregnancyData().rpDate).weeks;c._dynamic={};c.healthStatus='critical';a.result='Беременность замерла, плод погиб.';
        }
        persist();refresh();
    });
    dialog.addEventListener('change',e=>{
        const el=e.target,s=getSettings();s.profiles||={user:profile(s,'user'),char:profile(s,'char')};const p=s.profiles[who],a=care(getCarrier(who)),key=el.dataset.field;
        if(key){const v=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
            if(key==='load')return;
            if(key==='maternalMortality')s.maternalMortality=!!v;
            else if(key==='nextVisit'||key==='doctor')a[key]=v;
            else if(key==='readingSize')s.readingSize=Number(v);
            else if(key.startsWith('chance')){s.complicationChances ||= [30,15,1];s.complicationChances[Number(key.slice(-1))]=Math.max(0,Math.min(100,Number(v)));}
            else if(key.includes('.')){const [k,n]=key.split('.');p[k][n]=v;}
            else p[key]=v;
            if(key==='cycleType'&&v==='heat')p.heat.enabled=true;
            if(key==='heat.enabled'&&!v&&p.cycleType==='heat')p.cycleType='silent';
        }
        for(const kind of ['heat','rut'])if(el.dataset.tag===kind||el.dataset.customTags===kind){
            const defaults=[...dialog.querySelectorAll(`[data-tag="${kind}"]:checked`)].map(x=>({name:x.value,description:x.value}));
            const custom=dialog.querySelector(`[data-custom-tags="${kind}"]`).value.split('\n').filter(x=>x.trim()).map(x=>{const [name,...d]=x.split('|');return {name:name.trim(),description:d.join('|').trim()};});p[kind].tags=[...custom,...defaults];
        }
        if(el.dataset.catalog)p.disabledComplications=[...dialog.querySelectorAll('[data-catalog]:not(:checked)')].map(x=>x.dataset.catalog);
        if(el.hasAttribute('data-custom-complications'))p.customComplications=el.value.split('\n').filter(x=>x.trim()).map((line,i)=>{const [name,description='',stages='1,2,3']=line.split('|').map(x=>x.trim());return{id:p.customComplications.find(x=>x.name===name)?.id||customComplicationId(name),name,description,stages:(stages||'1,2,3').split(',').map(Number).filter(n=>[1,2,3].includes(n))};});
        s.profiles[who]=profile(s,who);persist();
        // Preserve typing position unless layout itself changed.
        if(['cycleType','cycleLength','readingSize','heat.mode','rut.mode','heat.enabled','rut.chanceMode'].includes(key))refresh();
        for(const k of ['heat','rut'])dialog.querySelector(`[data-tag-warning="${k}"]`).textContent=p[k].tags.length>5?'Больше пяти проявлений: часть может теряться в отыгрыше.':'Модель использует 1–2 проявления по ситуации.';
        if(key && el.type==='number' && el.isConnected){const saved=key.includes('.')?s.profiles[who][key.split('.')[0]][key.split('.')[1]]:s.profiles[who][key];if(saved!==undefined)el.value=saved;}
        document.documentElement.style.setProperty('--rp-reading-size',(s.readingSize||16)+'px');
    });
    dialog.addEventListener('close',()=>dialog.remove());refresh();dialog.showModal();
}
