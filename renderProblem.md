info
==> Cloning from https://github.com/Janno27/money-app
info
==> Checking out commit 46a159a4dff40e7f62ad036b8db3f2860cd9d7f6 in branch main
info
==> Downloading cache...
info
==> Transferred 455MB in 9s. Extraction took 9s.
info
==> Using Node.js version 22.12.0 (default)
info
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
info
==> Using Bun version 1.1.0 (default)
info
==> Docs on specifying a bun version: https://render.com/docs/bun-version
info
==> Running build command 'npm install && npm run build'...
info
info
changed 1 package, and audited 660 packages in 4s
info
info
187 packages are looking for funding
info
  run `npm fund` for details
info
critical
4 vulnerabilities (2 moderate, 1 high, 1 critical)
info
info
To address issues that do not require attention, run:
info
  npm audit fix
info
info
To address all issues possible, run:
info
  npm audit fix --force
info
info
Some issues need review, and may require choosing
info
a different dependency.
info
info
Run `npm audit` for details.
info
info
> my-app@0.1.0 build
info
> next build
info
info
   ▲ Next.js 15.1.0
info
info
   Creating an optimized production build ...
info
(node:145) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
debug
(Use `node --trace-deprecation ...` to show where the warning was created)
info
(node:177) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
debug
(Use `node --trace-deprecation ...` to show where the warning was created)
info
 ✓ Compiled successfully
info
   Linting and checking validity of types ...
info
info
Failed to compile.
info
info
./app/api/organization/member/route.ts
error
73:40  Error: 'userError' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
./app/join/page.tsx
error
27:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
28:10  Error: 'userId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
warning
87:6  Warning: React Hook useCallback has a missing dependency: 'organization?.name'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
info
info
./components/@components/AccountingGridView.tsx
error
76:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
77:3  Error: 'selectedMonths' is defined but never used.  @typescript-eslint/no-unused-vars
warning
318:6  Warning: React Hook React.useCallback has a missing dependency: 'isFetching'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
error
637:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
638:9  Error: 'activeYear' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
./components/@components/accounting/AccountingGridView.tsx
error
5:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
6:10  Error: 'format' is defined but never used.  @typescript-eslint/no-unused-vars
error
7:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
8:10  Error: 'fr' is defined but never used.  @typescript-eslint/no-unused-vars
error
30:3  Error: 'Row' is defined but never used.  @typescript-eslint/no-unused-vars
error
32:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
33:10  Error: 'ScrollArea' is defined but never used.  @typescript-eslint/no-unused-vars
error
47:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
49:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
79:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
80:11  Error: 'ColumnMeta' is defined but never used.  @typescript-eslint/no-unused-vars
error
80:22  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
error
80:29  Error: 'TValue' is defined but never used.  @typescript-eslint/no-unused-vars
error
101:24  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
error
101:31  Error: 'TValue' is defined but never used.  @typescript-eslint/no-unused-vars
error
118:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
119:3  Error: 'onSearchChange' is defined but never used.  @typescript-eslint/no-unused-vars
error
120:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
121:3  Error: 'onDateRangeChange' is defined but never used.  @typescript-eslint/no-unused-vars
warning
172:9  Warning: The 'fetchData' function makes the dependencies of useEffect Hook (at line 379) change on every render. To fix this, wrap the definition of 'fetchData' in its own useCallback() Hook.  react-hooks/exhaustive-deps
warning
601:9  Warning: The 'calculatePercentDifference' function makes the dependencies of useCallback Hook (at line 651) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'calculatePercentDifference' in its own useCallback() Hook.  react-hooks/exhaustive-deps
warning
607:9  Warning: The 'formatPercentage' function makes the dependencies of useCallback Hook (at line 651) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'formatPercentage' in its own useCallback() Hook.  react-hooks/exhaustive-deps
warning
613:9  Warning: The 'getDifferenceColorClass' function makes the dependencies of useCallback Hook (at line 651) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'getDifferenceColorClass' in its own useCallback() Hook.  react-hooks/exhaustive-deps
info
info
./components/@components/accounting/AccountingIncomeGridView.tsx
error
26:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
27:3  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
error
86:24  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
error
86:31  Error: 'TValue' is defined but never used.  @typescript-eslint/no-unused-vars
warning
155:9  Warning: The 'fetchData' function makes the dependencies of useEffect Hook (at line 362) change on every render. To fix this, wrap the definition of 'fetchData' in its own useCallback() Hook.  react-hooks/exhaustive-deps
error
656:24  Error: '_' is defined but never used.  @typescript-eslint/no-unused-vars
info
info
./components/@components/evolution/EvolutionDistribution.tsx
error
74:9  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
75:15  Error: 'categoryName' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
77:9  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
78:15  Error: 'subcategoryName' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
./components/@components/evolution/EvolutionSummary.tsx
error
5:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
6:10  Error: 'cn' is defined but never used.  @typescript-eslint/no-unused-vars
error
8:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
9:10  Error: 'Skeleton' is defined but never used.  @typescript-eslint/no-unused-vars
info
info
./components/@components/notes/NotesDrawer.tsx
error
194:19  Error: '_user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
./components/@components/planner/CategoryForecast.tsx
error
124:9  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
info
info
./components/@components/planner/PlannerChart.tsx
error
163:17  Error: '_isAfterCurrentMonth' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
230:13  Error: '_isAfterCurrentMonth' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
./components/@components/planner/PlannerSummary.tsx
error
5:52  Error: '_parse' is defined but never used.  @typescript-eslint/no-unused-vars
info
info
./components/onboarding/OnboardingGeneral.tsx
error
271:10  Error: '_SecondGroup' is defined but never used.  @typescript-eslint/no-unused-vars
error
272:3  Error: React Hook "useEffect" is called in function "_SecondGroup" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
327:10  Error: '_ThirdGroup' is defined but never used.  @typescript-eslint/no-unused-vars
error
328:3  Error: React Hook "useEffect" is called in function "_ThirdGroup" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
383:10  Error: '_FinalReveal' is defined but never used.  @typescript-eslint/no-unused-vars
error
384:41  Error: React Hook "useState" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
385:29  Error: React Hook "useState" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
386:37  Error: React Hook "useState" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
387:41  Error: React Hook "useState" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
388:43  Error: React Hook "useState" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
394:3  Error: React Hook "useEffect" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
416:3  Error: React Hook "useEffect" is called in function "_FinalReveal" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
619:10  Error: '_SuccessImportContent' is defined but never used.  @typescript-eslint/no-unused-vars
error
624:3  Error: React Hook "React.useEffect" is called in function "_SuccessImportContent" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".  react-hooks/rules-of-hooks
error
981:31  Error: 'email' is defined but never used.  @typescript-eslint/no-unused-vars
error
997:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
error
998:9  Error: 'handleInitializationAndContinue' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
1166:9  Error: 'handleAddNewCategory' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
1171:15  Error: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
1277:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
error
1561:9  Error: 'completeImport' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
1630:17  Error: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
1718:11  Error: 'containerRef' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
./components/onboarding/OnboardingTour.tsx
error
27:17  Error: '_totalSteps' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
30:21  Error: '_skipOnboarding' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
37:10  Error: '_step' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
37:17  Error: '_setStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
39:10  Error: '_loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
39:20  Error: '_setLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
41:10  Error: '_importFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
41:23  Error: '_setImportFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
42:9  Error: '_fileInputRef' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
43:10  Error: '_showSidebar' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
43:24  Error: '_setShowSidebar' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
224:9  Error: '_isLastStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
error
226:9  Error: '_isThemeStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
info
info
info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
info
==> Build failed 😞
info
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
You can also use theRender CLIto explore logs in your command line.

Looking for more logs? Try Log Streams.