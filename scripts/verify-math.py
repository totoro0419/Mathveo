"""Independent algebra verification of Mathveo's three original themes."""
import json
import sympy as s

x, b, c = s.symbols('x b c', real=True)
a = s.symbols('a', real=True, nonzero=True)
p, q, t = s.symbols('p q t', real=True)
checks = {}
checks['general_square_identity'] = s.simplify(a*x**2+b*x+c - (a*(x+b/(2*a))**2+c-b**2/(4*a))) == 0
checks['unit_square_identity'] = s.expand((x+b/2)**2-b**2/4) == x**2+b*x
checks['square_example_every_step'] = all(s.expand(expr) == 2*x**2-8*x+5 for expr in [2*(x**2-4*x)+5, 2*((x-2)**2-4)+5, 2*(x-2)**2-3])
checks['square_example_vertex'] = s.diff(2*(x-2)**2-3,x).subs(x,2) == 0 and (2*(x-2)**2-3).subs(x,2) == -3
checks['symmetry'] = s.expand((a*(x-p)**2+q).subs(x,p-t) - (a*(x-p)**2+q).subs(x,p+t)) == 0
checks['general_vertex'] = s.diff(a*x**2+b*x+c,x).subs(x,-b/(2*a)) == 0 and s.simplify((a*x**2+b*x+c).subs(x,-b/(2*a))-(c-b**2/(4*a))) == 0
f = -2*(x+1)**2+4
checks['vertex_example'] = s.diff(f,x).subs(x,-1) == 0 and f.subs(x,-1) == 4 and s.diff(f,x,2) < 0
f = -x**2+2*x+3
checks['interval_example_identity'] = s.expand(-(x-1)**2+4) == f
values = [f.subs(x,v) for v in [0,1,3]]
checks['interval_example_extrema'] = values == [3,4,0] and max(values) == 4 and min(values) == 0 and s.solve(s.diff(f,x),x) == [1]
checks['square_quiz'] = s.diff((x+3)**2-2,x).subs(x,-3) == 0 and ((x+3)**2-2).subs(x,-3) == -2
f = (x-2)**2+1
checks['interval_quiz'] = s.solve(s.diff(f,x),x) == [2] and f.subs(x,3) == 2 and f.subs(x,5) == 10
print(json.dumps({'engine': 'SymPy ' + s.__version__, 'checks': {k:bool(v) for k,v in checks.items()}, 'all_passed': all(checks.values())}, indent=2))
assert all(checks.values())
