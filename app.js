const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const booking=$('#booking'), success=$('#success');
let step=1, trip='ida-vuelta', vehicle='fronx', bags=0, stops=0, lastSummary='';
const CLP=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);


$$('[data-open-booking]').forEach(b=>b.onclick=()=>openBooking());
function chooseVehicleAndOpen(id){
  vehicle=id;
  if(id==='sprinter' && +pax.value<5)pax.value=5;
  openBooking();
}
$$('[data-book-vehicle]').forEach(b=>b.onclick=()=>chooseVehicleAndOpen(b.dataset.bookVehicle));
$('[data-frame-book]').forEach(b=>b.onclick=e=>{
  e.stopPropagation();
  vehicle=b.dataset.frameBook;
  const target=document.querySelector('#vehiculo-'+vehicle);
  if(target){
    history.replaceState(null,'','#vehiculo-'+vehicle);
    target.scrollIntoView({behavior:'smooth',block:'start'});
    target.classList.add('vehicle-focus');
    setTimeout(()=>target.classList.remove('vehicle-focus'),1400);
  }
});
function openBooking(){booking.showModal();step=1;render()}

const frameCards=$$('[data-frame-card]');
function activateFrame(card){frameCards.forEach(x=>x.classList.toggle('active',x===card));}
frameCards.forEach(card=>{
  const video=card.querySelector('.frame-video');
  let raf=0, dragging=false;
  const seek=(clientX)=>{
    const rect=card.getBoundingClientRect();
    const ratio=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
    card.style.setProperty('--seek',`${ratio*100}%`);
    card.style.setProperty('--mx',`${(ratio-.5)*-12}px`);
    if(video?.duration && Number.isFinite(video.duration)){
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{try{video.currentTime=Math.max(.05,Math.min(video.duration-.05,ratio*video.duration))}catch{}});
    }
  };
  card.addEventListener('pointerenter',e=>{activateFrame(card);if(video){video.pause();seek(e.clientX)}});
  card.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||dragging)seek(e.clientX)});
  card.addEventListener('pointerleave',()=>{dragging=false;card.style.setProperty('--mx','0px');if(video)video.play().catch(()=>{})});
  card.addEventListener('pointerdown',e=>{dragging=true;activateFrame(card);card.setPointerCapture?.(e.pointerId);seek(e.clientX)});
  card.addEventListener('pointerup',e=>{dragging=false;card.releasePointerCapture?.(e.pointerId)});
  card.addEventListener('focus',()=>activateFrame(card));
  card.addEventListener('click',e=>{if(e.target.closest('button'))return;activateFrame(card)});
  if(video){
    const ready=()=>card.classList.add('video-ready');
    video.addEventListener('loadedmetadata',()=>{ready();video.playbackRate=.72;video.play().catch(()=>{})});
    video.addEventListener('canplay',ready);
    video.addEventListener('timeupdate',()=>{if(!video.duration)return;card.style.setProperty('--seek',`${(video.currentTime/video.duration)*100}%`)});
    video.play().catch(()=>{});
  }
});

$$('[data-trip]').forEach(b=>b.onclick=()=>{trip=b.dataset.trip;$$('[data-trip]').forEach(x=>x.classList.toggle('selected',x===b));$$('.return-field').forEach(x=>x.style.display=trip==='ida-vuelta'?'grid':'none')});
const pax=$('#passengers');for(let i=1;i<=16;i++)pax.add(new Option(i,i));pax.value=2;pax.onchange=()=>{vehicle=+pax.value<=3?'fronx':+pax.value===4?'runner':'sprinter';renderVehicles()};
function renderVehicles(){const n=+pax.value;const list=[{id:'fronx',name:'Suzuki Fronx',cap:'1–3 pasajeros',price:'$110.000 / tramo',ok:n<=3},{id:'runner',name:'Toyota 4Runner',cap:'1–4 pasajeros',price:'$180.000 / tramo',ok:n<=4},{id:'sprinter',name:'Mercedes Sprinter',cap:'5–16 pasajeros',price:n>=7?'$26.000 p/p / tramo':'$38.000 p/p / tramo',ok:n>=5}];if(!list.find(x=>x.id===vehicle)?.ok)vehicle=list.find(x=>x.ok)?.id||'sprinter';$('#vehicleButtons').innerHTML=list.map(x=>`<button type="button" class="vehicle-choice ${vehicle===x.id?'selected':''}" data-v="${x.id}" ${!x.ok?'disabled':''}><strong>${x.name}</strong><span>${x.cap}</span><b>${x.ok?x.price:'No disponible para este grupo'}</b></button>`).join('');$$('[data-v]').forEach(b=>b.onclick=()=>{vehicle=b.dataset.v;renderVehicles()});$('#priorityWrap').style.display=n<=4?'flex':'none'}
$$('[data-count]').forEach(b=>b.onclick=()=>{const key=b.dataset.count,change=+b.dataset.change;if(key==='bags'){bags=Math.max(0,bags+change);$('#bagsCount').textContent=bags}else{stops=Math.max(0,stops+change);$('#stopsCount').textContent=stops}});
$('#back').onclick=()=>{if(step>1){step--;render()}};$('#next').onclick=()=>{if(!validate())return;if(step<4){step++;render()}else finish()};
function validate(){
  let required=step===1?[$('#date'),$('#time')]:step===2?[$('#flight'),$('#hotel')]:step===3?[$('#name'),$('#phone'),$('#email'),$('#passengerData')]:[];
  if(step===1&&trip==='ida-vuelta')required=[...required,$('#returnDate'),$('#returnTime')];
  const bad=required.find(x=>!x.value.trim()||!x.checkValidity());
  if(bad){bad.focus();bad.reportValidity();return false}
  if(step===1&&trip==='ida-vuelta'&&$('#returnDate').value<$('#date').value){
    $('#returnDate').setCustomValidity('La fecha de vuelta no puede ser anterior a la fecha de ida.');
    $('#returnDate').focus();
    $('#returnDate').reportValidity();
    return false;
  }
  $('#returnDate').setCustomValidity('');
  return true
}
function total(){const n=+pax.value,seg=trip==='ida-vuelta'?2:1;let base=vehicle==='fronx'?110000*seg:vehicle==='runner'?180000*seg:n>=7?(trip==='ida-vuelta'?49990:26000)*n:38000*n*seg;let rate=(bags+stops)*.1;if($('#priority').checked&&n<=4)rate+=.2;return {base,extra:Math.round(base*rate),total:Math.round(base*(1+rate))}}
function labelVehicle(){return {fronx:'Suzuki Fronx',runner:'Toyota 4Runner',sprinter:'Mercedes Sprinter'}[vehicle]}
function makeSummary(){const p=total();const route=trip==='ida-vuelta'?'Aeropuerto ↔ San Pedro':trip==='ida'?'Aeropuerto → San Pedro':'San Pedro → Aeropuerto';$('#summary').innerHTML=`<div><span>RECORRIDO</span><strong>${route}</strong></div><div><span>PASAJEROS</span><strong>${pax.value}</strong></div><div><span>SALIDA</span><strong>${$('#date').value} · ${$('#time').value}</strong></div><div><span>VEHÍCULO</span><strong>${labelVehicle()}</strong></div><div><span>VUELO</span><strong>${$('#flight').value}</strong></div><div><span>ALOJAMIENTO</span><strong>${$('#hotel').value}</strong></div><div class="total"><span>TOTAL ESTIMADO</span><strong>${CLP(p.total)}</strong></div>`;lastSummary=`Hola Taxi Hotel. Solicitud de ${$('#name').value}: ${route}, ${$('#date').value} ${$('#time').value}, ${pax.value} pasajero(s), ${labelVehicle()}, vuelo ${$('#flight').value}, alojamiento ${$('#hotel').value}, total estimado ${CLP(p.total)}.`}
function render(){ $$('.step').forEach(x=>x.classList.toggle('active',+x.dataset.step===step));$('.booking-progress i').style.width=`${step*25}%`;$('#stepLabel').textContent=`PASO ${step} DE 4`;const titles=[['¿Cuándo viajas?','Elige recorrido, fecha y hora.'],['Diseña tu traslado','Compara vehículos y agrega lo que necesites.'],['Datos para tu seguridad','Información esencial para cerrar el viaje.'],['Revisa tu solicitud','Confirmaremos disponibilidad antes del pago.']][step-1];$('#stepTitle').textContent=titles[0];$('#stepText').textContent=titles[1];$('#back').style.visibility=step===1?'hidden':'visible';$('#next').textContent=step===4?'Solicitar confirmación →':'Continuar →';if(step===2)renderVehicles();if(step===4)makeSummary()}
function finish(){const code=`TH-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;$('#reservationCode').textContent=code;lastSummary=`${lastSummary} Código ${code}.`;booking.close();success.showModal()}
$('#finishWhatsApp').onclick=async()=>{try{await navigator.clipboard.writeText(lastSummary)}catch{}window.open('https://wa.me/message/GWJW4AT4N3SKA1','_blank')};$('#closeSuccess').onclick=()=>success.close();
const today=new Date().toISOString().slice(0,10);
$('#date').min=today;
$('#returnDate').min=today;
$('#date').addEventListener('change',()=>{
  $('#returnDate').min=$('#date').value||today;
  $('#returnDate').setCustomValidity('');
  if($('#returnDate').value && $('#returnDate').value<$('#date').value)$('#returnDate').value=$('#date').value;
});
$('#returnDate').addEventListener('change',()=>$('#returnDate').setCustomValidity(''));
render();
