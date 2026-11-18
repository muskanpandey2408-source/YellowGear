// YellowGear Rentals - application logic
// Front end only: data is kept in the browser with localStorage.

// ============================================================
// 1. Helpers and local storage
// ============================================================

const $ = s => document.querySelector(s);
const mem = {};
const L = (k, d) => {
    try {
        const v = localStorage.getItem(k);
        if (v)
            return JSON.parse(v);
    } catch (e) {
    }
    return mem[k] ?? d;
};
const S = (k, v) => {
    mem[k] = v;
    try {
        localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
    }
};
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const TD = iso(new Date());
const add = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return iso(d);
};
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5) + 1;

// ============================================================
// 2. Constants and SVG vehicle images
// ============================================================

const TYPES = ['Car', 'SUV', 'Van', 'Bike', 'Scooter'];
const ST = ['available', 'rented', 'maintenance'];
const COL = { Car: '#ffd60a', SUV: '#f2f2f2', Van: '#e8b800', Bike: '#ff8a00', Scooter: '#ffffff' };

const VEHICLE_PHOTOS = {
    // Individually selected automotive photographs; remote images need internet access.
    'Aero Hatch': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop&q=85',
    'Voltra Sedan': 'https://public.readdy.ai/ai/img_res/481dd336aad20e51d1c1c9edae008464.jpg',
    'Ridge Explorer': 'https://p5.itc.cn/images01/20211011/6dec8dcd55394150a971292c98328435.png',
    'Trail Hunter': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&auto=format&fit=crop&q=85',
    'Cargo Max': 'https://carsite.co.za/api/media/2014/02/chicago-auto-show5.jpg?q=75&v=2&w=1920',
    'Roadster 350': 'https://images.squarespace-cdn.com/content/v1/651cae001b8f000e1c9e6124/b1e727af-110b-4e54-99db-7df22e6953f9/2025_YZF-R9_DPBMC_AUS_STA_006.jpg',
    'Cruise 150': 'https://360carscan.com/wp-content/uploads/360-images/122336/70.jpg',
    'Zip Scoot': 'https://www.velcamotor.com/web/image/5392-0467bb26/Velca%20ONE.jpg'
};
const TYPE_PHOTOS = {
    Car: VEHICLE_PHOTOS['Aero Hatch'],
    SUV: VEHICLE_PHOTOS['Ridge Explorer'],
    Van: VEHICLE_PHOTOS['Cargo Max'],
    Bike: VEHICLE_PHOTOS['Roadster 350'],
    Scooter: VEHICLE_PHOTOS['Zip Scoot']
};

function art(t, c, h, vehicleName) {
    const src = VEHICLE_PHOTOS[vehicleName] || TYPE_PHOTOS[t] || TYPE_PHOTOS.Car;
    const alt = vehicleName || (t + ' rental vehicle');
    return `<div class="photo-stage ${h ? 'photo-hero' : ''} photo-${t.toLowerCase()}">
        <img src="${src}" alt="${alt}" loading="${h ? 'eager' : 'lazy'}" referrerpolicy="no-referrer"
             onerror="this.onerror=null;this.src='${TYPE_PHOTOS[t] || TYPE_PHOTOS.Car}'">
        <span class="photo-shade"></span>
        <span class="photo-category">${t}</span>
        ${h ? '<span class="photo-caption">YOUR NEXT JOURNEY STARTS HERE</span>' : ''}
    </div>`;
}

// ============================================================
// 3. Data: users, vehicles, bookings, maintenance logs
// ============================================================

const SEED = [['Aero Hatch', 'Car', 1800, 5, 'Petrol', 'Manual'], ['Voltra Sedan', 'Car', 3200, 5, 'Electric', 'Auto'], ['Ridge Explorer', 'SUV', 4500, 7, 'Diesel', 'Auto'], ['Trail Hunter', 'SUV', 5200, 5, 'Diesel', 'Manual'], ['Cargo Max', 'Van', 5800, 12, 'Diesel', 'Manual'], ['Roadster 350', 'Bike', 900, 2, 'Petrol', 'Manual'], ['Cruise 150', 'Bike', 700, 2, 'Petrol', 'Manual'], ['Zip Scoot', 'Scooter', 500, 2, 'Electric', 'Auto']];
let U = L('yg_u', null);
let V = L('yg_v', null);
let B = L('yg_b', null);
let G = L('yg_g', null);
let me = L('yg_me', null);
if (!V) {
    U = [{ name: 'Fleet Admin', email: 'admin@yellowgear.in', pass: 'admin123', phone: '', admin: true }];
    V = SEED.map((s, i) => ({ id: i + 1, name: s[0], type: s[1], price: s[2], seats: s[3], fuel: s[4], trans: s[5], status: i == 7 ? 'maintenance' : 'available' }));
    B = [{ id: 'BKDEMO1', vid: 3, user: 'demo@yellowgear.in', s: add(3), e: add(6), days: 4, total: 18000, status: 'Confirmed', made: TD }, { id: 'BKDEMO2', vid: 2, user: 'demo@yellowgear.in', s: add(-2), e: add(1), days: 4, total: 12800, status: 'Picked up', made: add(-5) }];
    V[1].status = 'rented';
    G = [{ vid: 8, date: add(-1), note: 'Brake pads replacement started' }];
    sv();
}

function sv() {
    S('yg_u', U);
    S('yg_v', V);
    S('yg_b', B);
    S('yg_g', G);
    S('yg_me', me);
}
const vh = id => V.find(v => v.id == id);
const usr = () => U.find(u => u.email == me);
const adm = () => usr()?.admin;
const clash = (vid, s, e, ig) => B.some(b => b.vid == vid && b.id != ig && !['Cancelled', 'Returned'].includes(b.status) && s <= b.e && e >= b.s);
const inr = n => '₹' + n.toLocaleString('en-IN');
const toast = t => {
    const e = $('#toast');
    e.textContent = t;
    e.style.display = 'block';
    clearTimeout(toast.t);
    toast.t = setTimeout(() => e.style.display = 'none', 2800);
};

// ============================================================
// 4. Navigation and page routing
// ============================================================

let F = { q: '', type: '', max: 6000, sort: '', from: '', to: '', avail: '' };
let cal = { vid: 1, y: new Date().getFullYear(), m: new Date().getMonth() };

function nav() {
    const p = (location.hash || '#fleet').slice(1);
    const L = [['fleet', 'Fleet'], ['calendar', 'Calendar']];
    if (me)
        L.push(['bookings', 'My bookings']);
    if (adm())
        L.push(['admin', 'Admin']);
    if (!me)
        L.push(['login', 'Log in']);
    $('#nav').innerHTML = L.map(x => `<a href="#${x[0]}" class="${p == x[0] ? 'on' : ''}">${x[1]}</a>`).join('');
    $('#who').innerHTML = me ? `${usr().name} <button class="btn ghost sm" onclick="out()">Log out</button>` : '';
}

function out() {
    me = null;
    sv();
    location.hash = '#fleet';
    route();
}

function route() {
    nav();
    const p = (location.hash || '#fleet').slice(1);
    ({ fleet, calendar, bookings, admin, login }[p] || fleet)();
    scrollTo(0, 0);
}
addEventListener('hashchange', route);

// ============================================================
// 5. Fleet catalogue, search and filters
// ============================================================

function fleet() {
    $('#v').innerHTML = `<section class="hero"><div><h1>Pick it up.<br>Ride it out.</h1><p>Cars, SUVs, vans, bikes and scooters. Choose your dates, see what is free, and lock your vehicle in under a minute.</p><br><a class="btn" href="#cat" style="text-decoration:none;display:inline-block">Browse the fleet</a></div><div class="art">${art('SUV', '#ffd60a', 1)}</div></section>
<div class="road"></div><div class="types">${TYPES.map(t => `<button onclick="F.type=F.type=='${t}'?'':'${t}';fl();grid()" id="t-${t}">${art(t, COL[t])}<span>${t == 'SUV' ? 'SUVs' : t + 's'}</span></button>`).join('')}</div>
<div class="how"><div><b>Pick dates</b><p>Vehicles booked on your dates disappear from the list.</p></div><div><b>Choose a vehicle</b><p>Compare price, seats and fuel.</p></div><div><b>Book and get a receipt</b><p>Dates lock instantly, no double bookings.</p></div><div><b>Return it</b><p>The team logs your return and frees the vehicle.</p></div></div>
<h2 id="cat">Our fleet</h2><div class="bar"><label>Search<input id="q" placeholder="Name or fuel" value="${F.q}" oninput="F.q=this.value;grid()"></label>
<label>Pickup<input type="date" min="${TD}" value="${F.from}" onchange="F.from=this.value;grid()"></label><label>Return<input type="date" min="${TD}" value="${F.to}" onchange="F.to=this.value;grid()"></label>
<label>Type<select onchange="F.type=this.value;fl();grid()" id="ft"><option value="">All types</option>${TYPES.map(t => `<option ${F.type == t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
<label>Max price per day: <span id="mx">${inr(F.max)}</span><input type="range" min="500" max="6000" step="100" value="${F.max}" oninput="F.max=+this.value;$('#mx').textContent=inr(F.max);grid()"></label>
<label>Sort<select onchange="F.sort=this.value;grid()"><option value="">Featured</option><option value="a">Price, low to high</option><option value="d">Price, high to low</option></select></label>
<label>Status<select onchange="F.avail=this.value;grid()"><option value="">Any</option><option value="available">Available only</option></select></label></div><div class="grid" id="grid"></div>`;
    fl();
    grid();
}

function fl() {
    TYPES.forEach(t => $('#t-' + t)?.classList.toggle('sel', F.type == t));
    if ($('#ft'))
        $('#ft').value = F.type;
}

function grid() {
    let l = V.filter(v => (!F.type || v.type == F.type) && v.price <= F.max && (!F.q || (v.name + v.fuel + v.type).toLowerCase().includes(F.q.toLowerCase())) && (!F.avail || v.status == 'available'));
    if (F.from && F.to && F.to >= F.from)
        l = l.filter(v => v.status != 'maintenance' && !clash(v.id, F.from, F.to));
    if (F.sort)
        l.sort((a, b) => F.sort == 'a' ? a.price - b.price : b.price - a.price);
    $('#grid').innerHTML = l.map(v => `<article class="card"><div class="im">${art(v.type, COL[v.type], 0, v.name)}<span class="st ${v.status}">${v.status}</span></div><div class="bd"><h3>${v.name}</h3><p>${v.type}, ${v.seats} seats, ${v.fuel}, ${v.trans}</p><div class="row"><b>${inr(v.price)}<small> /day</small></b><span class="card-actions"><button class="btn ghost sm" onclick="cal.vid=${v.id};location.hash='#calendar'">Dates</button><button class="btn sm book-action" ${v.status == 'maintenance' ? 'disabled' : ''} onclick="book(${v.id})"><span class="book-icon">↗</span> Book</button></span></div></div></article>`).join('') || '<div class="empty">No vehicle matches. Try different dates or raise the price limit.</div>';
}

// ============================================================
// 6. Booking engine and receipt
// ============================================================

function book(id) {
    if (!me) {
        toast('Log in or register to book');
        location.hash = '#login';
        return;
    }
    const v = vh(id);
    $('#mb').innerHTML = `<div class="im">${art(v.type, COL[v.type], 0, v.name)}</div><h3>${v.name}, ${inr(v.price)} per day</h3><label>Pickup<input type="date" id="bs" min="${TD}" value="${F.from}" oninput="tot(${id})"></label><label>Return<input type="date" id="be" min="${TD}" value="${F.to}" oninput="tot(${id})"></label><p id="bt" class="note">Choose your dates.</p><div class="row"><button class="btn ghost" onclick="$('#m').close()">Cancel</button><button class="btn" onclick="confirmB(${id})">Confirm booking</button></div>`;
    $('#m').showModal();
    tot(id);
}

function tot(id) {
    const s = $('#bs').value;
    const e = $('#be').value;
    if (!s || !e || e < s) {
        $('#bt').textContent = 'Choose a pickup date and a return date on or after it.';
        return;
    }
    const d = days(s, e);
    $('#bt').textContent = clash(id, s, e) ? 'This vehicle is already booked in that range.' : `${d} day${d > 1 ? 's' : ''}, total ${inr(d * vh(id).price)}`;
}

function confirmB(id) {
    const s = $('#bs').value;
    const e = $('#be').value;
    const v = vh(id);
    if (!s || !e || s < TD || e < s)
        return toast('Enter valid dates');
    if (v.status == 'maintenance')
        return toast('Vehicle is under maintenance');
    if (clash(id, s, e))
        return toast('Dates overlap an existing booking');
    const d = days(s, e);
    const b = { id: 'BK' + Date.now().toString(36).toUpperCase(), vid: id, user: me, s, e, days: d, total: d * v.price, status: 'Confirmed', made: TD };
    B.push(b);
    sv();
    $('#mb').innerHTML = `<h3>Booking confirmed</h3><div class="rc"><p><b>Receipt ${b.id}</b></p><p>Customer: ${usr().name}</p><p>Vehicle: ${v.name} (${v.type})</p><p>Pickup: ${s}</p><p>Return: ${e} (${d} days)</p><p>Total: <b>${inr(b.total)}</b>, pay at pickup</p></div><div class="row"><button class="btn ghost" onclick="print()">Print receipt</button><button class="btn" onclick="$('#m').close();location.hash='#bookings'">View my bookings</button></div>`;
}

// ============================================================
// 7. Availability calendar
// ============================================================

function calendar() {
    const v = vh(cal.vid);
    const first = new Date(cal.y, cal.m, 1);
    const n = new Date(cal.y, cal.m + 1, 0).getDate();
    let c = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => `<div class="h">${x}</div>`).join('') + '<div></div>'.repeat(first.getDay());
    for (let d = 1; d <= n; d++) {
        const k = iso(new Date(cal.y, cal.m, d));
        const bk = B.some(b => b.vid == v.id && !['Cancelled', 'Returned'].includes(b.status) && k >= b.s && k <= b.e);
        c += `<div class="${bk ? 'bk' : ''} ${k < TD ? 'past' : ''}">${d}</div>`;
    }
    $('#v').innerHTML = `<h2>Availability calendar</h2><div class="bar"><label>Vehicle<select onchange="cal.vid=+this.value;calendar()">${V.map(x => `<option value="${x.id}" ${x.id == v.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label></div>
<div class="cal"><div class="im" style="max-width:320px">${art(v.type, COL[v.type])}</div><div class="row" style="margin-top:1rem"><button class="btn ghost sm" onclick="mo(-1)">Previous</button><h3>${first.toLocaleString('en', { month: 'long', year: 'numeric' })}</h3><button class="btn ghost sm" onclick="mo(1)">Next</button></div><div class="cg">${c}</div><p class="note">Yellow days are booked. Plain days are free. Status now: <span class="${v.status}">${v.status}</span>.</p><button class="btn" ${v.status == 'maintenance' ? 'disabled' : ''} onclick="book(${v.id})">Book ${v.name}</button></div>`;
}

function mo(d) {
    cal.m += d;
    if (cal.m > 11) {
        cal.m = 0;
        cal.y++;
    }
    if (cal.m < 0) {
        cal.m = 11;
        cal.y--;
    }
    calendar();
}

// ============================================================
// 8. Customer booking history
// ============================================================

let bf = '';

function bookings() {
    const l = B.filter(b => b.user == me && (!bf || b.status == bf)).sort((a, b) => b.s.localeCompare(a.s));
    $('#v').innerHTML = `<h2>My bookings</h2><div class="bar"><label>Status<select onchange="bf=this.value;bookings()"><option value="">All</option>${['Confirmed', 'Picked up', 'Returned', 'Cancelled'].map(s => `<option ${bf == s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
<div class="tw"><table><tr><th>Receipt</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr>${l.map(b => `<tr><td>${b.id}</td><td>${vh(b.vid).name}</td><td>${b.s} to ${b.e}</td><td>${inr(b.total)}</td><td>${b.status}</td><td>${b.status == 'Confirmed' ? `<button class="btn ghost sm" onclick="setB('${b.id}','Cancelled')">Cancel</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No bookings yet. Pick a vehicle from the fleet.</td></tr>'}</table></div>`;
}

function setB(id, s, cond) {
    const b = B.find(x => x.id == id);
    const v = vh(b.vid);
    b.status = s;
    if (s == 'Picked up')
        v.status = 'rented';
    if (s == 'Returned') {
        v.status = cond || 'available';
        if (cond == 'maintenance')
            G.push({ vid: v.id, date: TD, note: 'Sent to maintenance after return ' + b.id });
    }
    sv();
    toast('Booking ' + s.toLowerCase());
    route();
}

// ============================================================
// 9. Admin dashboard
// ============================================================

let af = '';
let aq = '';

function admin() {
    if (!adm()) {
        location.hash = '#login';
        return;
    }
    const n = V.length;
    const c = k => V.filter(v => v.status == k).length;
    const rev = B.filter(b => b.status != 'Cancelled').reduce((a, b) => a + b.total, 0);
    const util = v => {
        let u = 0;
        for (let i = 0; i < 30; i++) {
            const k = add(i);
            if (B.some(b => b.vid == v.id && !['Cancelled', 'Returned'].includes(b.status) && k >= b.s && k <= b.e))
                u++;
        }
        return Math.round(u / 30 * 100);
    };
    const bl = B.filter(b => (!af || b.status == af) && (!aq || (b.user + b.id + vh(b.vid).name).toLowerCase().includes(aq.toLowerCase())));
    $('#v').innerHTML = `<h2>Admin dashboard</h2><div class="stats"><div><b>${n}</b>Vehicles</div><div><b>${c('available')}</b>Available</div><div><b>${c('rented')}</b>Rented out</div><div><b>${c('maintenance')}</b>In maintenance</div><div><b>${inr(rev)}</b>Booked revenue</div></div>
<h3>Add a vehicle</h3><div class="form"><label>Name<input id="an"></label><label>Type<select id="at">${TYPES.map(t => `<option>${t}</option>`).join('')}</select></label><label>Price per day<input id="ap" type="number" min="100"></label><label>Seats<input id="as" type="number" min="1" value="2"></label><label>Fuel<select id="af">${['Petrol', 'Diesel', 'Electric'].map(t => `<option>${t}</option>`).join('')}</select></label><label>Gearbox<select id="ag"><option>Manual</option><option>Auto</option></select></label><label>&nbsp;<button class="btn" onclick="addV()">Add vehicle</button></label></div>
<h3 style="margin-top:2rem">Fleet status and utilization (next 30 days)</h3><div class="tw"><table><tr><th>Vehicle</th><th>Price</th><th>Status</th><th>Utilization</th><th>Edit</th></tr>${V.map(v => `<tr><td>${v.name} (${v.type})</td><td><input type="number" value="${v.price}" style="width:90px" onchange="vh(${v.id}).price=+this.value;sv();toast('Price updated')"></td><td><select onchange="stV(${v.id},this.value)">${ST.map(s => `<option ${v.status == s ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><div class="ub"><i style="width:${util(v)}%"></i></div>${util(v)}%</td><td><button class="btn ghost sm" onclick="delV(${v.id})">Remove</button></td></tr>`).join('')}</table></div>
<h3>All bookings</h3><div class="bar"><label>Search<input value="${aq}" oninput="aq=this.value;admin();$('#v').querySelector('.bar input').focus()"></label><label>Status<select onchange="af=this.value;admin()"><option value="">All</option>${['Confirmed', 'Picked up', 'Returned', 'Cancelled'].map(s => `<option ${af == s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
<div class="tw"><table><tr><th>Receipt</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Status</th><th>Action</th></tr>${bl.map(b => `<tr><td>${b.id}</td><td>${b.user}</td><td>${vh(b.vid).name}</td><td>${b.s} to ${b.e}</td><td>${b.status}</td><td>${b.status == 'Confirmed' ? `<button class="btn sm" onclick="setB('${b.id}','Picked up')">Approve pickup</button>` : b.status == 'Picked up' ? `<select id="r${b.id}"><option value="available">Good condition</option><option value="maintenance">Needs maintenance</option></select> <button class="btn sm" onclick="setB('${b.id}','Returned',$('#r${b.id}').value)">Log return</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No bookings match.</td></tr>'}</table></div>
<h3>Maintenance log</h3><div class="tw"><table><tr><th>Date</th><th>Vehicle</th><th>Note</th></tr>${[...G].reverse().map(g => `<tr><td>${g.date}</td><td>${vh(g.vid)?.name || 'Removed'}</td><td>${g.note}</td></tr>`).join('')}</table></div>`;
}

function addV() {
    const n = $('#an').value.trim();
    const p = +$('#ap').value;
    if (!n || !p)
        return toast('Enter a name and a price');
    V.push({ id: Math.max(0, ...V.map(v => v.id)) + 1, name: n, type: $('#at').value, price: p, seats: +$('#as').value || 2, fuel: $('#af').value, trans: $('#ag').value, status: 'available' });
    sv();
    toast('Vehicle added');
    admin();
}

function stV(id, s) {
    vh(id).status = s;
    if (s == 'maintenance')
        G.push({ vid: id, date: TD, note: 'Marked under maintenance by admin' });
    if (s == 'available')
        G.push({ vid: id, date: TD, note: 'Back in service' });
    sv();
    admin();
}

function delV(id) {
    if (B.some(b => b.vid == id && ['Confirmed', 'Picked up'].includes(b.status)))
        return toast('Vehicle has active bookings');
    V = V.filter(v => v.id != id);
    sv();
    admin();
}

// ============================================================
// 10. Registration and login
// ============================================================

let reg = false;

function login() {
    $('#v').innerHTML = `<h2>${reg ? 'Create your account' : 'Welcome back'}</h2><br><div class="box">${reg ? '<label>Full name<input id="ln"></label><label>Phone<input id="lp" type="tel"></label>' : ''}<label>Email<input id="le" type="email"></label><label>Password<input id="lw" type="password"></label><button class="btn" onclick="auth()">${reg ? 'Register' : 'Log in'}</button><button class="btn ghost" onclick="reg=!reg;login()">${reg ? 'I already have an account' : 'Create an account'}</button><p class="note">Admin demo: admin@yellowgear.in / admin123. Data is saved only in this browser.</p></div>`;
}

function auth() {
    const e = $('#le').value.trim().toLowerCase();
    const w = $('#lw').value;
    if (!e || !w)
        return toast('Enter email and password');
    if (reg) {
        const n = $('#ln').value.trim();
        if (!n || w.length < 6)
            return toast('Add your name and a 6+ character password');
        if (U.some(u => u.email == e))
            return toast('That email is already registered');
        U.push({ name: n, email: e, pass: w, phone: $('#lp').value });
    } else if (!U.some(u => u.email == e && u.pass == w))
        return toast('Email or password is incorrect');
    me = e;
    sv();
    toast('Signed in');
    location.hash = adm() ? '#admin' : '#fleet';
    route();
}
route();


// ============================================================
// 11. Motion polish: reveal newly rendered sections as they enter view
// ============================================================
(function initMotionObserver() {
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const revealTargets = '.card, .how > div, .stats > div, .box, .cal, .form';
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('motion-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    function scan(root) {
        if (root.matches?.(revealTargets)) observer.observe(root);
        root.querySelectorAll?.(revealTargets).forEach(el => observer.observe(el));
    }
    const app = document.querySelector('#v');
    if (app) {
        scan(app);
        new MutationObserver(() => scan(app)).observe(app, { childList: true, subtree: true });
    }
})();

// ============================================================
// 12. Advanced interactions: ambient orbs, scroll progress, 3D card tilt
// ============================================================
(function initAdvancedMotion() {
    if (document.querySelector('#yg-progress')) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const progress = document.createElement('div');
    progress.id = 'yg-progress';
    document.body.appendChild(progress);

    const fx = document.createElement('div');
    fx.className = 'yg-fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<i class="yg-orb"></i><i class="yg-orb"></i><i class="yg-orb"></i>';
    document.body.prepend(fx);

    let ticking = false;
    const updateProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { window.requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
    updateProgress();

    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const attachTilt = root => {
        const cards = [];
        if (root.matches?.('.card')) cards.push(root);
        root.querySelectorAll?.('.card').forEach(card => cards.push(card));
        cards.forEach(card => {
            if (card.dataset.tiltReady) return;
            card.dataset.tiltReady = '1';
            card.classList.add('motion-tilt');
            card.addEventListener('pointermove', event => {
                const r = card.getBoundingClientRect();
                const x = (event.clientX - r.left) / r.width;
                const y = (event.clientY - r.top) / r.height;
                const rx = (0.5 - y) * 5;
                const ry = (x - 0.5) * 7;
                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });
    };
    const app = document.querySelector('#v');
    if (app) {
        attachTilt(app);
        new MutationObserver(() => attachTilt(app)).observe(app, { childList: true, subtree: true });
    }
})();
