import os
import re

new_nav = """<ul class="navbar-nav ml-auto">
						<li class="nav-item">
							<a class="nav-link" href="index.html">Home</a>
						</li>
						<li class="nav-item">
							<a class="nav-link" href="shop.html">Shop</a>
						</li>
						<li class="nav-item">
							<a class="nav-link" href="blog.html">Blog</a>
						</li>
						<li class="nav-item nav-login-link">
							<a class="nav-link" href="login.html"><i class="fas fa-user mr-1"></i>Login</a>
						</li>
						<li class="nav-item nav-logout-link" style="display:none">
							<a class="nav-link nav-username" href="orders.html" style="color:coral; font-weight:700;"></a>
						</li>
						<li class="nav-item nav-logout-link" style="display:none">
							<a class="nav-link" href="#" onclick="doLogout()" style="color:#fff;">Logout</a>
						</li>
						<li class="nav-item">
							<a class="nav-link" href="#"><i class="fas fa-search"></i></a>
							<input type="text" id="searchInput" placeholder="Search for products..." />
						</li>
						<li class="nav-item">
							<a class="nav-link" href="cart.html"><i class="fas fa-shopping-cart"></i><span class="cart-badge">0</span></a>
						</li>
					</ul>"""

skip_files = ['login.html', 'cart.html', 'checkout.html', 'orders.html']

def update():
    for f in os.listdir('.'):
        if f.endswith('.html') and f not in skip_files:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Use regex to find <ul class="navbar-nav ml-auto"> until </ul>
            pattern = re.compile(r'<ul\s+class="navbar-nav\s+ml-auto".*?</ul>', re.DOTALL)
            
            if pattern.search(content):
                new_content = pattern.sub(new_nav, content)
                with open(f, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Updated {f}")

if __name__ == "__main__":
    update()
