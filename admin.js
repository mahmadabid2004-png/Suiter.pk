// ── Storage helpers ──────────────────────────────────
var globalOrders = [];
var isOrdersLoaded = false;

var globalUsers = [];
var isUsersLoaded = false;

function getOrders(){return globalOrders;}
function getUsers(){return globalUsers;}

function fallbackLocalOrders() {
  globalOrders = JSON.parse(localStorage.getItem('sk_orders')||'[]');
  isOrdersLoaded = true;
  isUsersLoaded = true; // no separate user store locally
  refreshCurrentSection();
}

function listenForOrders() {
  if (typeof firebase !== 'undefined' && dbReady) {
    var timeout = setTimeout(function() {
      if (!isOrdersLoaded) {
        console.warn('[Suiters.pk] Firebase connection timed out. Using local data.');
        fallbackLocalOrders();
      }
    }, 4000);

    try {
      firebase.database().ref('orders').on('value', function(snap) {
        clearTimeout(timeout);
        var val = snap.val();
        var arr = [];
        if (val) {
          Object.keys(val).forEach(function(k){
            if(val[k]) arr.push(val[k]);
          });
        }
        arr.sort(function(a,b){ return new Date(b.createdAt||0) - new Date(a.createdAt||0); });
        globalOrders = arr;
        isOrdersLoaded = true;
        refreshCurrentSection();
      }, function(err) {
        clearTimeout(timeout);
        console.error('[Suiters.pk] Firebase DB read error:', err);
        fallbackLocalOrders();
      });
    } catch (e) {
      clearTimeout(timeout);
      console.warn('[Suiters.pk] Firebase DB init error (check databaseURL):', e);
      fallbackLocalOrders();
    }
  } else {
    fallbackLocalOrders();
  }
}

// ── Firebase Users Listener ──────────────────────────
function listenForUsers() {
  if (typeof firebase !== 'undefined' && dbReady) {
    try {
      firebase.database().ref('users').on('value', function(snap) {
        var val = snap.val();
        var arr = [];
        if (val) {
          Object.keys(val).forEach(function(uid) {
            if (val[uid]) arr.push(Object.assign({ uid: uid }, val[uid]));
          });
        }
        arr.sort(function(a,b){ return new Date(b.createdAt||0) - new Date(a.createdAt||0); });
        globalUsers = arr;
        isUsersLoaded = true;
        refreshCurrentSection();
      }, function(err) {
        console.warn('[Suiters.pk] Users DB read error:', err);
        isUsersLoaded = true;
        refreshCurrentSection();
      });
    } catch(e) {
      console.warn('[Suiters.pk] Users listener error:', e);
      isUsersLoaded = true;
    }
  } else {
    isUsersLoaded = true;
  }
}

function refreshCurrentSection() {
  if(sessionStorage.getItem('sk_admin')!=='1') return;
  var active = document.querySelector('.sidebar nav a.active');
  if(!active) return;

  var name = 'overview';
  if(active.innerHTML.includes('Orders')) name='orders';
  else if(active.innerHTML.includes('Revenue')) name='revenue';
  else if(active.innerHTML.includes('Products')) name='products';
  else if(active.innerHTML.includes('Customers')) name='customers';
  else if(active.innerHTML.includes('Settings')) name='settings';

  var needsOrders  = ['overview','orders','revenue','products'].indexOf(name) > -1;
  var needsUsers   = name === 'customers';
  var stillLoading = (needsOrders && !isOrdersLoaded) || (needsUsers && !isUsersLoaded);

  if(stillLoading){
    document.getElementById('sectionContent').innerHTML = '<div style="padding:40px;text-align:center;color:#888"><i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:10px"></i><br/>Loading data...</div>';
    return;
  }

  if (name === 'orders') {
      var searchEl = document.getElementById('orderSearch');
      var wrap = document.getElementById('ordersTableWrap');
      if (wrap) {
          var sf = document.getElementById('statusFilter');
          var statusF = sf ? sf.value : '';
          var q = (searchEl ? searchEl.value : '').toLowerCase();
          var all = getOrders().filter(function(o){
            var match=!q||(o.orderId||'').toLowerCase().includes(q)||(o.customer&&o.customer.name||'').toLowerCase().includes(q)||(o.customer&&o.customer.city||'').toLowerCase().includes(q)||(o.customer&&o.customer.phone||'').includes(q);
            var sm=!statusF||(o.status||'received')===statusF;
            return match&&sm;
          });
          wrap.innerHTML = buildTable(all, true);
          var h3 = document.querySelector('.orders-toolbar h3');
          if (h3) h3.innerHTML = '<i class="fas fa-list"></i>All Orders (' + getOrders().length + ')';
          return;
      }
  }

  if (name === 'customers') {
      var wrap2 = document.getElementById('usersTableWrap');
      if (wrap2) {
          var q2 = (document.getElementById('userSearch') ? document.getElementById('userSearch').value : '').toLowerCase();
          filterUsersTable(q2);
          return;
      }
  }

  if (name !== 'settings') {
      showSection(name, active, true);
  }
}

function getAdminCreds(){return JSON.parse(localStorage.getItem('sk_admin_creds')||'{"user":"zaynabrehann@gmail.com","pass":"suiters2024"}');}

// ── Auth ─────────────────────────────────────────────
function doLogout(){
  sessionStorage.removeItem('sk_admin');
  window.location.href = 'login.html';
}

if(sessionStorage.getItem('sk_admin')==='1'){
  var dash = document.getElementById('dashboard');
  if(dash) dash.style.display='block';
} else {
  window.location.href = 'login.html';
}

// ── Init ─────────────────────────────────────────────
function initDashboard(){
  document.getElementById('dateDisplay').textContent=new Date().toLocaleDateString('en-PK',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  showSection('overview',document.querySelector('.sidebar nav a'));
}

// ── Router ────────────────────────────────────────────
function showSection(name,el,isRefresh){
  if(!isRefresh) {
    document.querySelectorAll('.sidebar nav a').forEach(function(a){a.classList.remove('active');});
    if(el)el.classList.add('active');
    var titles={overview:'Overview',orders:'Manage Orders',revenue:'Revenue Analytics',products:'Product Sales',customers:'Registered Users',settings:'Settings'};
    document.getElementById('sectionTitle').textContent=titles[name]||name;
  }
  var c=document.getElementById('sectionContent');

  var needsOrders  = ['overview','orders','revenue','products'].indexOf(name) > -1;
  var needsUsers   = name === 'customers';
  var stillLoading = (needsOrders && !isOrdersLoaded) || (needsUsers && !isUsersLoaded);

  if(stillLoading && name !== 'settings') {
      c.innerHTML = '<div style="padding:40px;text-align:center;color:#888"><i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:10px"></i><br/>Loading data from cloud...</div>';
      return;
  }

  if(name==='overview'){c.innerHTML=buildOverview();renderOverviewCharts();}
  else if(name==='orders'){c.innerHTML=buildOrdersSection();bindOrderSearch();}
  else if(name==='revenue'){c.innerHTML=buildRevenue();renderRevenueChart();}
  else if(name==='products'){c.innerHTML=buildProducts();}
  else if(name==='customers'){c.innerHTML=buildCustomers();bindUserSearch();}
  else if(name==='settings'){if(!isRefresh) c.innerHTML=buildSettings();}
}

// ── Stat card ────────────────────────────────────────
function statCard(icon,color,value,label,sub){
  return '<div class="stat-card"><div class="icon" style="color:'+color+'"><i class="'+icon+'"></i></div>'+
    '<div class="value">'+value+'</div><div class="label">'+label+'</div>'+
    '<div class="change neutral">'+sub+'</div></div>';
}

// ── Overview ─────────────────────────────────────────
function buildOverview(){
  var o=getOrders();
  var total=o.reduce(function(s,x){return s+(x.total||0);},0);
  var cities={};o.forEach(function(x){var c=(x.customer&&x.customer.city)||'?';cities[c]=(cities[c]||0)+1;});
  var topCity=Object.keys(cities).sort(function(a,b){return cities[b]-cities[a];})[0]||'—';
  var regUsers = getUsers().length;
  return '<div class="stats-grid">'+
    statCard('fas fa-shopping-bag','#e8532a',o.length,'Total Orders','All time')+
    statCard('fas fa-rupee-sign','#4caf50','Rs.'+total.toLocaleString(),'Total Revenue','All orders')+
    statCard('fas fa-users','#2196f3',regUsers,'Registered Users','In database')+
    statCard('fas fa-map-marker-alt','#ff9800',topCity,'Top City','Most orders')+
  '</div>'+
  '<div class="panels">'+
    '<div class="panel"><h3><i class="fas fa-chart-line"></i>Orders — Last 7 Days</h3><canvas id="chartOrders"></canvas></div>'+
    '<div class="panel"><h3><i class="fas fa-credit-card"></i>Order Status Split</h3><canvas id="chartPay"></canvas></div>'+
  '</div>'+
  '<div class="orders-panel"><h3><i class="fas fa-clock"></i>Recent Orders</h3>'+buildTable(getOrders().slice(0,5),false)+'</div>';
}

function renderOverviewCharts(){
  var orders=getOrders();
  var days={};
  for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days[d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})]=0;}
  orders.forEach(function(o){if(!o.createdAt)return;var d=new Date(o.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});if(days[d]!==undefined)days[d]++;});
  var ctx1=document.getElementById('chartOrders');
  if(ctx1)new Chart(ctx1,{type:'line',data:{labels:Object.keys(days),datasets:[{label:'Orders',data:Object.values(days),borderColor:'#e8532a',backgroundColor:'rgba(232,83,42,0.1)',fill:true,tension:0.4,pointBackgroundColor:'#e8532a'}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#252b3b'},ticks:{color:'#888'}},y:{grid:{color:'#252b3b'},ticks:{color:'#888',stepSize:1}}}}});
  var pm={};orders.forEach(function(o){pm[o.paymentMethod||'Unknown']=(pm[o.paymentMethod||'Unknown']||0)+1;});
  var ctx2=document.getElementById('chartPay');
  if(ctx2)new Chart(ctx2,{type:'doughnut',data:{labels:Object.keys(pm),datasets:[{data:Object.values(pm),backgroundColor:['#e8532a','#2196f3','#4caf50','#ff9800'],borderWidth:0}]},options:{responsive:true,plugins:{legend:{labels:{color:'#aaa'}}},cutout:'65%'}});
}

// ── Orders ───────────────────────────────────────────
function buildOrdersSection(){
  var o=getOrders();
  return '<div class="orders-panel">'+
    '<div class="orders-toolbar">'+
      '<h3><i class="fas fa-list"></i>All Orders ('+o.length+')</h3>'+
      '<div class="toolbar-actions">'+
        '<input type="text" id="orderSearch" placeholder="🔍 Search by name, city, ID..." oninput="filterOrders(this.value)"/>'+
        '<select id="statusFilter" onchange="filterOrders(document.getElementById(\'orderSearch\').value)">'+
          '<option value="">All Statuses</option>'+
          '<option value="received">Received</option>'+
          '<option value="processing">Processing</option>'+
          '<option value="delivered">Delivered</option>'+
          '<option value="cancelled">Cancelled</option>'+
        '</select>'+
        '<button class="btn-export" onclick="exportCSV()"><i class="fas fa-download"></i> Export CSV</button>'+
        '<button class="btn-danger-sm" onclick="clearAllOrders()"><i class="fas fa-trash"></i> Clear All</button>'+
      '</div>'+
    '</div>'+
    '<div id="ordersTableWrap">'+buildTable(o,true)+'</div>'+
  '</div>';
}

function buildTable(orders,showActions){
  if(!orders.length)return '<p style="color:#888;text-align:center;padding:30px">No orders found.</p>';
  var statuses=['received','processing','delivered','cancelled'];
  var rows=orders.map(function(o){
    var s=o.status||'received';
    var opts=statuses.map(function(st){return '<option value="'+st+'"'+(s===st?' selected':'')+'>'+st.charAt(0).toUpperCase()+st.slice(1)+'</option>';}).join('');
    var actions=showActions?
      '<td><select class="status-sel" onchange="updateStatus(\''+o.orderId+'\',this.value)">'+opts+'</select></td>'+
      '<td><button class="btn-view" onclick="viewOrder(\''+o.orderId+'\')"><i class="fas fa-eye"></i></button> '+
      '<button class="btn-del" onclick="deleteOrder(\''+o.orderId+'\')"><i class="fas fa-trash"></i></button></td>':'';
    return '<tr>'+
      '<td style="font-weight:700;color:#e8532a;font-size:0.75rem">'+(o.orderId||'—')+'</td>'+
      '<td>'+(o.customer&&o.customer.name||'—')+'</td>'+
      '<td>'+(o.customer&&o.customer.phone||'—')+'</td>'+
      '<td>'+(o.customer&&o.customer.city||'—')+'</td>'+
      '<td style="color:#4caf50;font-weight:700">Rs.'+(o.total||0).toLocaleString()+'</td>'+
      '<td style="font-size:0.78rem">'+(o.paymentMethod||'—')+'</td>'+
      '<td>'+(o.paymentMethod==='Cash on Delivery'?'<span style="color:#ff9800;font-weight:700;font-size:0.72rem">💵 COD</span>':o.paymentStatus==='paid'?'<span style="color:#4caf50;font-weight:700;font-size:0.72rem">✅ Paid</span>':o.paymentStatus==='failed'?'<span style="color:#e85555;font-weight:700;font-size:0.72rem">❌ Failed</span>':'<span style="color:#ffb74d;font-weight:700;font-size:0.72rem">⏳ Pending</span>')+'</td>'+
      '<td><span class="badge '+(s.replace(' ','_'))+'">' +s+'</span></td>'+
      '<td style="color:#666;font-size:0.72rem">'+(o.createdAt?new Date(o.createdAt).toLocaleDateString('en-PK'):'—')+'</td>'+
      actions+
    '</tr>';
  }).join('');
  var extraTh=showActions?'<th>Update Status</th><th>Actions</th>':'';
  return '<div style="overflow-x:auto"><table class="orders-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>City</th><th>Total</th><th>Method</th><th>Pay Status</th><th>Status</th><th>Date</th>'+extraTh+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function filterOrders(q){
  var sf=document.getElementById('statusFilter');
  var statusF=sf?sf.value:'';
  q=(q||'').toLowerCase();
  var all=getOrders().filter(function(o){
    var match=!q||(o.orderId||'').toLowerCase().includes(q)||(o.customer&&o.customer.name||'').toLowerCase().includes(q)||(o.customer&&o.customer.city||'').toLowerCase().includes(q)||(o.customer&&o.customer.phone||'').includes(q);
    var sm=!statusF||(o.status||'received')===statusF;
    return match&&sm;
  });
  var wrap=document.getElementById('ordersTableWrap');
  if(wrap)wrap.innerHTML=buildTable(all,true);
}

function bindOrderSearch(){
  var s=document.getElementById('orderSearch');
  if(s)s.addEventListener('input',function(){filterOrders(this.value);});
}

function updateStatus(id,status){
  var fallback = function() {
    var orders=getOrders();
    orders.forEach(function(o){if(o.orderId===id)o.status=status;});
    localStorage.setItem('sk_orders',JSON.stringify(orders));
    globalOrders = orders;
    refreshCurrentSection();
  };
  try {
    if (typeof firebase !== 'undefined' && dbReady) {
      firebase.database().ref('orders/' + id + '/status').set(status).catch(fallback);
    } else { fallback(); }
  } catch(e) { fallback(); }
  showToastAdmin('Status updated to: '+status,'success');
}

function deleteOrder(id){
  if(!confirm('Delete order #'+id+'?'))return;
  var fallback = function() {
    var o=getOrders().filter(function(x){return x.orderId!==id;});
    localStorage.setItem('sk_orders',JSON.stringify(o));
    globalOrders = o;
    refreshCurrentSection();
  };
  try {
    if (typeof firebase !== 'undefined' && dbReady) {
      firebase.database().ref('orders/' + id).remove().catch(fallback);
    } else { fallback(); }
  } catch(e) { fallback(); }
  showToastAdmin('Order deleted.','warning');
}

function clearAllOrders(){
  if(!confirm('Delete ALL orders? This cannot be undone.'))return;
  var fallback = function() {
    localStorage.setItem('sk_orders','[]');
    globalOrders = [];
    refreshCurrentSection();
  };
  try {
    if (typeof firebase !== 'undefined' && dbReady) {
      firebase.database().ref('orders').remove().catch(fallback);
    } else { fallback(); }
  } catch(e) { fallback(); }
  showToastAdmin('All orders cleared.','warning');
}

function viewOrder(id){
  var o=getOrders().find(function(x){return x.orderId===id;});
  if(!o)return;
  var items=(o.items||[]).map(function(i){return '<tr><td>'+i.name+'</td><td>'+(i.size||'—')+'</td><td>'+i.quantity+'</td><td>Rs.'+(i.price*i.quantity).toLocaleString()+'</td></tr>';}).join('');

  // Payment action section removed as only COD is supported
  var paySection='';

  var html='<div class="modal-overlay" id="orderModal" onclick="closeModal(event)">'+
    '<div class="modal-box">'+
      '<div class="modal-header"><h3>Order #'+o.orderId+'</h3><button onclick="document.getElementById(\'orderModal\').remove()" style="background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer">&times;</button></div>'+
      '<div class="modal-body">'+
        '<div class="modal-grid">'+
          '<div><strong>Customer</strong><p>'+(o.customer&&o.customer.name||'—')+'</p></div>'+
          '<div><strong>Phone</strong><p>'+(o.customer&&o.customer.phone||'—')+'</p></div>'+
          '<div><strong>Email</strong><p>'+(o.customer&&o.customer.email||'—')+'</p></div>'+
          '<div><strong>City</strong><p>'+(o.customer&&o.customer.city||'—')+', '+(o.customer&&o.customer.province||'')+'</p></div>'+
          '<div><strong>Address</strong><p>'+(o.customer&&o.customer.address||'—')+'</p></div>'+
          '<div><strong>Payment Method</strong><p>'+(o.paymentMethod||'—')+'</p></div>'+
          '<div><strong>Order Status</strong><p><span class="badge '+(o.status||'received')+'">'+(o.status||'received')+'</span></p></div>'+
          '<div><strong>Date</strong><p>'+(o.createdAt?new Date(o.createdAt).toLocaleString('en-PK'):'—')+'</p></div>'+
        '</div>'+
        '<h4 style="margin:16px 0 10px;color:#aaa;font-size:0.82rem;text-transform:uppercase">Items</h4>'+
        '<table class="orders-table"><thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>'+items+'</tbody></table>'+
        '<div style="text-align:right;margin-top:16px;font-size:1.1rem;font-weight:800;color:#4caf50">Total: Rs.'+(o.total||0).toLocaleString()+'</div>'+
        (o.notes?'<p style="margin-top:12px;color:#888;font-size:0.82rem">Notes: '+o.notes+'</p>':'')+
        paySection+
      '</div>'+
    '</div>'+
  '</div>';
  document.body.insertAdjacentHTML('beforeend',html);
}

function closeModal(e){if(e.target.id==='orderModal')e.target.remove();}

// ── CSV Export ───────────────────────────────────────
function exportCSV(){
  var orders=getOrders();
  if(!orders.length){showToastAdmin('No orders to export.','warning');return;}
  var rows=[['Order ID','Name','Phone','Email','City','Province','Address','Total','Payment','Status','Date','Items']];
  orders.forEach(function(o){
    var items=(o.items||[]).map(function(i){return i.name+'x'+i.quantity;}).join('; ');
    rows.push([o.orderId,(o.customer&&o.customer.name)||'',(o.customer&&o.customer.phone)||'',(o.customer&&o.customer.email)||'',(o.customer&&o.customer.city)||'',(o.customer&&o.customer.province)||'',(o.customer&&o.customer.address)||'',o.total||0,o.paymentMethod||'',o.status||'',o.createdAt?new Date(o.createdAt).toLocaleDateString('en-PK'):'',items]);
  });
  var csv=rows.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='suiters_orders_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  showToastAdmin('CSV exported!','success');
}

// ── Revenue ──────────────────────────────────────────
function buildRevenue(){
  var o=getOrders();
  var total=o.reduce(function(s,x){return s+(x.total||0);},0);
  var avg=o.length?Math.round(total/o.length):0;
  var max=o.reduce(function(m,x){return Math.max(m,x.total||0);},0);
  var delivered=o.filter(function(x){return x.status==='delivered';}).reduce(function(s,x){return s+(x.total||0);},0);
  return '<div class="stats-grid">'+
    statCard('fas fa-rupee-sign','#4caf50','Rs.'+total.toLocaleString(),'Total Revenue','All orders')+
    statCard('fas fa-calculator','#2196f3','Rs.'+avg.toLocaleString(),'Avg Order Value','Per order')+
    statCard('fas fa-trophy','#ff9800','Rs.'+max.toLocaleString(),'Largest Order','Single order')+
    statCard('fas fa-check-circle','#4caf50','Rs.'+delivered.toLocaleString(),'Confirmed Revenue','Delivered only')+
  '</div>'+
  '<div class="panels">'+
    '<div class="panel"><h3><i class="fas fa-chart-bar"></i>Revenue by Payment</h3><canvas id="chartRev"></canvas></div>'+
    '<div class="panel"><h3><i class="fas fa-chart-pie"></i>Order Status Split</h3><canvas id="chartStatus"></canvas></div>'+
  '</div>';
}

function renderRevenueChart(){
  var o=getOrders();
  var pm={};o.forEach(function(x){pm[x.paymentMethod||'Unknown']=(pm[x.paymentMethod||'Unknown']||0)+(x.total||0);});
  var ctx=document.getElementById('chartRev');
  if(ctx)new Chart(ctx,{type:'bar',data:{labels:Object.keys(pm),datasets:[{data:Object.values(pm),backgroundColor:['rgba(232,83,42,.7)','rgba(33,150,243,.7)','rgba(76,175,80,.7)','rgba(255,152,0,.7)'],borderRadius:8,borderWidth:0}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#252b3b'},ticks:{color:'#888'}},y:{grid:{color:'#252b3b'},ticks:{color:'#888',callback:function(v){return 'Rs.'+v.toLocaleString();}}}}}});
  var ss={};o.forEach(function(x){var s=x.status||'received';ss[s]=(ss[s]||0)+1;});
  var ctx2=document.getElementById('chartStatus');
  if(ctx2)new Chart(ctx2,{type:'doughnut',data:{labels:Object.keys(ss),datasets:[{data:Object.values(ss),backgroundColor:['#64b5f6','#ffb74d','#81c784','#e85555'],borderWidth:0}]},options:{responsive:true,plugins:{legend:{labels:{color:'#aaa'}}},cutout:'60%'}});
}

// ── Products ─────────────────────────────────────────
function buildProducts(){
  var orders=getOrders();
  var prod={};
  orders.forEach(function(o){(o.items||[]).forEach(function(i){if(!prod[i.name])prod[i.name]={qty:0,rev:0};prod[i.name].qty+=i.quantity||1;prod[i.name].rev+=(i.price||0)*(i.quantity||1);});});
  var sorted=Object.keys(prod).sort(function(a,b){return prod[b].qty-prod[a].qty;});
  if(!sorted.length)return '<div class="orders-panel"><p style="color:#888;padding:40px;text-align:center"><i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:16px;opacity:.3"></i>No product data yet. Place orders to see analytics.</p></div>';
  var rows=sorted.map(function(n,i){
    var pct=Math.round((prod[n].qty/sorted.reduce(function(s,x){return s+prod[x].qty;},0))*100);
    return '<tr><td style="color:#888">'+(i+1)+'</td><td style="font-weight:600;color:#fff">'+n+'</td>'+
      '<td style="color:#e8532a;font-weight:700">'+prod[n].qty+'</td>'+
      '<td style="color:#4caf50;font-weight:700">Rs.'+prod[n].rev.toLocaleString()+'</td>'+
      '<td><div style="background:#252b3b;border-radius:4px;height:8px;width:120px"><div style="background:#e8532a;width:'+pct+'%;height:100%;border-radius:4px"></div></div></td></tr>';
  }).join('');
  return '<div class="orders-panel"><h3><i class="fas fa-tshirt"></i>Product Performance</h3>'+
    '<table class="orders-table"><thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Share</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

// ── Customers (Registered Users from Firebase) ───────
function buildCustomers(){
  var users = getUsers();
  var orders = getOrders();

  // Build order stats per user (matched by email or phone)
  var orderMap = {};
  orders.forEach(function(o){
    var key = (o.customer && o.customer.email) || (o.customer && o.customer.phone) || '';
    if(!key) return;
    if(!orderMap[key]) orderMap[key] = {count:0, total:0, last:''};
    orderMap[key].count++;
    orderMap[key].total += (o.total||0);
    if((o.createdAt||'') > orderMap[key].last) orderMap[key].last = o.createdAt||'';
  });

  var noUsers = !users.length;
  var rows = users.map(function(u,i){
    var key = u.email || u.phone || '';
    var stats = orderMap[key] || {count:0, total:0, last:''};
    var joinDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-PK') : '—';
    var lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-PK') : '—';
    return '<tr>'+
      '<td style="color:#888">'+(i+1)+'</td>'+
      '<td style="font-weight:600;color:#fff">'+(u.name||'—')+'</td>'+
      '<td>'+(u.phone||'—')+'</td>'+
      '<td style="font-size:0.78rem">'+(u.email||'—')+'</td>'+
      '<td>'+(u.city||'—')+'</td>'+
      '<td style="color:#e8532a;font-weight:700">'+stats.count+'</td>'+
      '<td style="color:#4caf50;font-weight:700">'+(stats.total?'Rs.'+stats.total.toLocaleString():'—')+'</td>'+
      '<td style="color:#888;font-size:0.75rem">'+joinDate+'</td>'+
      '<td style="color:#888;font-size:0.75rem">'+lastLogin+'</td>'+
      '<td><button class="btn-del" onclick="deleteUser(\''+u.uid+'\')" title="Delete user"><i class="fas fa-trash"></i></button></td>'+
    '</tr>';
  }).join('');

  return '<div class="orders-panel">'+
    '<div class="orders-toolbar">'+
      '<h3><i class="fas fa-users"></i> Registered Users ('+(noUsers?'0':users.length)+')</h3>'+
      '<div class="toolbar-actions">'+
        '<input type="text" id="userSearch" placeholder="🔍 Search by name, phone, email..." oninput="filterUsersTable(this.value)"/>'+
        '<button class="btn-export" onclick="exportContactsCSV()"><i class="fas fa-download"></i> Download Contacts</button>'+
      '</div>'+
    '</div>'+
    (noUsers
      ? '<p style="color:#888;padding:40px;text-align:center"><i class="fas fa-user-slash" style="font-size:2.5rem;display:block;margin-bottom:12px;opacity:.3"></i>No registered users yet. Users appear here when they sign up.</p>'
      : '<div id="usersTableWrap" style="overflow-x:auto"><table class="orders-table">'+
          '<thead><tr>'+
            '<th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>City</th>'+
            '<th>Orders</th><th>Total Spent</th><th>Joined</th><th>Last Login</th><th>Action</th>'+
          '</tr></thead>'+
          '<tbody id="usersTbody">'+rows+'</tbody>'+
        '</table></div>')+
  '</div>';
}

function filterUsersTable(q){
  q = (q||'').toLowerCase();
  var users = getUsers();
  var orders = getOrders();
  var orderMap = {};
  orders.forEach(function(o){
    var key = (o.customer&&o.customer.email)||(o.customer&&o.customer.phone)||'';
    if(!key) return;
    if(!orderMap[key]) orderMap[key]={count:0,total:0};
    orderMap[key].count++; orderMap[key].total+=(o.total||0);
  });
  var filtered = users.filter(function(u){
    return !q || (u.name||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q) ||
      (u.phone||'').includes(q) ||
      (u.city||'').toLowerCase().includes(q);
  });
  var tbody = document.getElementById('usersTbody');
  if(!tbody) return;
  tbody.innerHTML = filtered.map(function(u,i){
    var key = u.email||u.phone||'';
    var stats = orderMap[key]||{count:0,total:0};
    return '<tr>'+
      '<td style="color:#888">'+(i+1)+'</td>'+
      '<td style="font-weight:600;color:#fff">'+(u.name||'—')+'</td>'+
      '<td>'+(u.phone||'—')+'</td>'+
      '<td style="font-size:0.78rem">'+(u.email||'—')+'</td>'+
      '<td>'+(u.city||'—')+'</td>'+
      '<td style="color:#e8532a;font-weight:700">'+stats.count+'</td>'+
      '<td style="color:#4caf50;font-weight:700">'+(stats.total?'Rs.'+stats.total.toLocaleString():'—')+'</td>'+
      '<td style="color:#888;font-size:0.75rem">'+(u.createdAt?new Date(u.createdAt).toLocaleDateString('en-PK'):'—')+'</td>'+
      '<td style="color:#888;font-size:0.75rem">'+(u.lastLogin?new Date(u.lastLogin).toLocaleDateString('en-PK'):'—')+'</td>'+
      '<td><button class="btn-del" onclick="deleteUser(\''+u.uid+'\')" title="Delete"><i class="fas fa-trash"></i></button></td>'+
    '</tr>';
  }).join('');
}

function bindUserSearch(){
  var s = document.getElementById('userSearch');
  if(s) s.addEventListener('input', function(){ filterUsersTable(this.value); });
}

function deleteUser(uid){
  if(!confirm('Delete this user from the database? This cannot be undone.')) return;
  try {
    if(typeof firebase !== 'undefined' && dbReady){
      firebase.database().ref('users/'+uid).remove().catch(function(){
        globalUsers = globalUsers.filter(function(u){return u.uid!==uid;});
        refreshCurrentSection();
      });
      showToastAdmin('User deleted from database.','warning');
    } else {
      globalUsers = globalUsers.filter(function(u){return u.uid!==uid;});
      refreshCurrentSection();
      showToastAdmin('User removed (local only).','warning');
    }
  } catch(e){
    globalUsers = globalUsers.filter(function(u){return u.uid!==uid;});
    refreshCurrentSection();
  }
}

function exportContactsCSV(){
  var users = getUsers();
  if(!users.length){showToastAdmin('No users to export.','warning');return;}
  var rows = [['Name','Phone','Email','City','Joined','Last Login']];
  users.forEach(function(u){
    rows.push([
      u.name||'',
      u.phone||'',
      u.email||'',
      u.city||'',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-PK') : '',
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-PK') : ''
    ]);
  });
  var csv = rows.map(function(r){
    return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');
  }).join('\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'suiters_contacts_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  showToastAdmin('Contacts CSV downloaded! (' + users.length + ' users)','success');
}

// ── Settings ─────────────────────────────────────────
function buildSettings(){
  var c=getAdminCreds();
  return '<div class="orders-panel" style="max-width:520px">'+
    '<h3><i class="fas fa-cog"></i>Admin Settings</h3>'+
    '<div class="form-group"><label>Email Address</label><input id="s-user" type="text" value="'+c.user+'" class="s-input"/></div>'+
    '<div class="form-group"><label>Current Password</label><input id="s-cur" type="password" placeholder="Enter current password" class="s-input"/></div>'+
    '<div class="form-group"><label>New Password</label><input id="s-new" type="password" placeholder="New password" class="s-input"/></div>'+
    '<div class="form-group"><label>Confirm New Password</label><input id="s-con" type="password" placeholder="Confirm new password" class="s-input"/></div>'+
    '<button onclick="saveSettings()" style="background:linear-gradient(135deg,#e8532a,#ff7043);border:none;color:#fff;padding:12px 32px;border-radius:8px;font-weight:700;cursor:pointer;margin-top:8px"><i class="fas fa-save"></i> Save Changes</button>'+
    '<p id="s-msg" style="margin-top:12px;font-size:0.85rem"></p>'+
  '</div>';
}

function saveSettings(){
  var c=getAdminCreds();
  var cur=document.getElementById('s-cur').value;
  var nw=document.getElementById('s-new').value;
  var con=document.getElementById('s-con').value;
  var user=document.getElementById('s-user').value.trim();
  var msg=document.getElementById('s-msg');
  if(cur!==c.pass){msg.style.color='#e85555';msg.textContent='Current password is incorrect.';return;}
  if(nw&&nw!==con){msg.style.color='#e85555';msg.textContent='New passwords do not match.';return;}
  if(!user){msg.style.color='#e85555';msg.textContent='Email Address cannot be empty.';return;}
  localStorage.setItem('sk_admin_creds',JSON.stringify({user:user,pass:nw||cur}));
  msg.style.color='#4caf50';msg.textContent='Settings saved successfully!';
}

// ── Toast ────────────────────────────────────────────
function showToastAdmin(msg,type){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;background:'+(type==='success'?'#4caf50':type==='warning'?'#ff9800':'#e85555')+';color:#fff;padding:12px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadeIn .3s ease';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},3000);
}

if(sessionStorage.getItem('sk_admin')==='1'){
  initDashboard();
  listenForOrders();
  listenForUsers();
}
