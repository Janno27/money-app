Cloning from https://github.com/Janno27/money-app
==> Checking out commit f353ba4ab25d174f81c95b9106d78cda2b80f8bc in branch main
==> Downloading cache...
==> Transferred 457MB in 9s. Extraction took 10s.
==> Using Node.js version 22.12.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Using Bun version 1.1.0 (default)
==> Docs on specifying a bun version: https://render.com/docs/bun-version
==> Running build command 'npm install && npm run build'...
changed 1 package, and audited 660 packages in 3s
187 packages are looking for funding
  run `npm fund` for details
4 vulnerabilities (2 moderate, 1 high, 1 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues possible, run:
  npm audit fix --force
Some issues need review, and may require choosing
a different dependency.
Run `npm audit` for details.
> my-app@0.1.0 build
> next build
   ▲ Next.js 15.1.0
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
Failed to compile.
./app/api/organization/member/route.ts
73:40  Error: '_userError' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./app/join/page.tsx
28:10  Error: '_userId' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/@components/AccountingGridView.tsx
77:3  Error: 'selectedMonths' is defined but never used.  @typescript-eslint/no-unused-vars
634:9  Error: '_activeYear' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/@components/accounting/AccountingGridView.tsx
69:11  Error: 'ColumnMeta' is defined but never used.  @typescript-eslint/no-unused-vars
69:22  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
69:29  Error: 'TValue' is defined but never used.  @typescript-eslint/no-unused-vars
90:24  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
90:31  Error: 'TValue' is defined but never used.  @typescript-eslint/no-unused-vars
157:9  Warning: The 'fetchData' function makes the dependencies of useEffect Hook (at line 364) change on every render. To fix this, wrap the definition of 'fetchData' in its own useCallback() Hook.  react-hooks/exhaustive-deps
586:9  Warning: The 'calculatePercentDifference' function makes the dependencies of useCallback Hook (at line 636) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'calculatePercentDifference' in its own useCallback() Hook.  react-hooks/exhaustive-deps
592:9  Warning: The 'formatPercentage' function makes the dependencies of useCallback Hook (at line 636) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'formatPercentage' in its own useCallback() Hook.  react-hooks/exhaustive-deps
598:9  Warning: The 'getDifferenceColorClass' function makes the dependencies of useCallback Hook (at line 636) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'getDifferenceColorClass' in its own useCallback() Hook.  react-hooks/exhaustive-deps
./components/@components/accounting/AccountingIncomeGridView.tsx
26:3  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
27:3  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
86:24  Error: 'TData' is defined but never used.  @typescript-eslint/no-unused-vars
86:31  Error: 'TValue' is defined but never used.  @typescript-eslint/no-unused-vars
155:9  Warning: The 'fetchData' function makes the dependencies of useEffect Hook (at line 362) change on every render. To fix this, wrap the definition of 'fetchData' in its own useCallback() Hook.  react-hooks/exhaustive-deps
656:24  Error: '_' is defined but never used.  @typescript-eslint/no-unused-vars
./components/@components/evolution/EvolutionDistribution.tsx
75:15  Error: '_categoryName' is assigned a value but never used.  @typescript-eslint/no-unused-vars
78:15  Error: '_subcategoryName' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/@components/notes/NotesDrawer.tsx
194:19  Error: '_user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/@components/planner/PlannerChart.tsx
163:17  Error: '_isAfterCurrentMonth' is assigned a value but never used.  @typescript-eslint/no-unused-vars
230:13  Error: '_isAfterCurrentMonth' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/@components/planner/PlannerSummary.tsx
5:52  Error: '_parse' is defined but never used.  @typescript-eslint/no-unused-vars
./components/onboarding/OnboardingGeneral.tsx
271:10  Error: 'SecondGroup' is defined but never used.  @typescript-eslint/no-unused-vars
327:10  Error: 'ThirdGroup' is defined but never used.  @typescript-eslint/no-unused-vars
383:10  Error: 'FinalReveal' is defined but never used.  @typescript-eslint/no-unused-vars
619:10  Error: 'SuccessImportContent' is defined but never used.  @typescript-eslint/no-unused-vars
981:31  Error: '_email' is defined but never used.  @typescript-eslint/no-unused-vars
998:9  Error: '_handleInitializationAndContinue' is assigned a value but never used.  @typescript-eslint/no-unused-vars
1166:9  Error: '_handleAddNewCategory' is assigned a value but never used.  @typescript-eslint/no-unused-vars
1277:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
1561:9  Error: 'completeImport' is assigned a value but never used.  @typescript-eslint/no-unused-vars
1630:17  Error: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
1718:11  Error: 'containerRef' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/onboarding/OnboardingTour.tsx
27:17  Error: '_totalSteps' is assigned a value but never used.  @typescript-eslint/no-unused-vars
30:21  Error: '_skipOnboarding' is assigned a value but never used.  @typescript-eslint/no-unused-vars
37:10  Error: '_step' is assigned a value but never used.  @typescript-eslint/no-unused-vars
37:17  Error: '_setStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
39:10  Error: '_loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
39:20  Error: '_setLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
41:10  Error: '_importFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
41:23  Error: '_setImportFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
42:9  Error: '_fileInputRef' is assigned a value but never used.  @typescript-eslint/no-unused-vars
43:10  Error: '_showSidebar' is assigned a value but never used.  @typescript-eslint/no-unused-vars
43:24  Error: '_setShowSidebar' is assigned a value but never used.  @typescript-eslint/no-unused-vars
224:9  Error: '_isLastStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
226:9  Error: '_isThemeStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
./components/ui/login-form.tsx
13:8  Error: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
