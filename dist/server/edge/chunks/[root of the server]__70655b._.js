(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root of the server]__70655b._.js", {

"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": (function(__turbopack_context__) {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, m: module, e: exports, t: __turbopack_require_real__ } = __turbopack_context__;
{
const mod = __turbopack_external_require__("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[externals]/node:buffer [external] (node:buffer, cjs)": (function(__turbopack_context__) {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, m: module, e: exports, t: __turbopack_require_real__ } = __turbopack_context__;
{
const mod = __turbopack_external_require__("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[project]/middleware.ts [middleware] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "config": (()=>config),
    "middleware": (()=>middleware)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$auth$2d$helpers$2d$nextjs$2f$dist$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/@supabase/auth-helpers-nextjs/dist/index.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_import__("[project]/node_modules/next/dist/esm/api/server.js [middleware] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware] (ecmascript)");
;
;
// Cache pour les sessions, avec une durée de vie de 1 minute
const sessionCache = new Map();
const SESSION_CACHE_DURATION = 60000 // 1 minute en millisecondes
;
async function middleware(req) {
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$auth$2d$helpers$2d$nextjs$2f$dist$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["createMiddlewareClient"])({
        req,
        res
    });
    try {
        // Génération d'une clé de cache basée sur le token d'authentification
        // Utiliser await avec cookies() pour éviter l'erreur "cookies() should be awaited"
        const supabaseCookie = req.cookies.get('sb-ouiwpkxvjxcfbypmurap-auth-token')?.value;
        const cacheKey = supabaseCookie || 'anonymous';
        // Vérifier si nous avons une session en cache et si elle est encore valide
        const now = Date.now();
        const cachedData = sessionCache.get(cacheKey);
        let session = null;
        if (cachedData && now - cachedData.timestamp < SESSION_CACHE_DURATION) {
            // Utiliser la session en cache
            session = cachedData.session;
            console.log("Using cached session");
        } else {
            // Récupérer une nouvelle session
            const { data } = await supabase.auth.getSession();
            session = data.session;
            // Mettre en cache la session
            sessionCache.set(cacheKey, {
                session,
                timestamp: now
            });
            console.log("Fetched new session");
        }
        // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
        const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup') || req.nextUrl.pathname.startsWith('/accept-invitation') || req.nextUrl.pathname.startsWith('/join');
        const isOnboardingRoute = req.nextUrl.pathname.startsWith('/onboarding');
        if (!session && !isAuthRoute && !isOnboardingRoute && req.nextUrl.pathname !== '/') {
            console.log("Redirecting to login (unauthenticated)");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/login', req.url));
        }
        // Si l'utilisateur est connecté et tente d'accéder à la page login/signup
        if (session && isAuthRoute) {
            console.log("Redirecting to onboarding (already authenticated)");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/onboarding', req.url));
        }
        return res;
    } catch (error) {
        console.error("Middleware error:", error);
        // En cas d'erreur, continuer sans bloquer l'utilisateur
        return res;
    }
}
const config = {
    matcher: [
        /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth page)
     */ '/',
        '/dashboard/:path*',
        '/onboarding',
        '/((?!_next/static|_next/image|favicon.ico|login).*)'
    ]
};
}}),
}]);

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__70655b._.js.map