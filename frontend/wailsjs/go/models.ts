export namespace main {
	
	export class BlacklistEntry {
	    id: number;
	    ip: string;
	    reason?: string;
	    expiresAt: number;
	    createdAt: number;
	
	    static createFrom(source: any = {}) {
	        return new BlacklistEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.ip = source["ip"];
	        this.reason = source["reason"];
	        this.expiresAt = source["expiresAt"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class UpdateInfo {
	    latest_version: string;
	    download_url: string;
	    release_notes: string;
	    is_mandatory: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.latest_version = source["latest_version"];
	        this.download_url = source["download_url"];
	        this.release_notes = source["release_notes"];
	        this.is_mandatory = source["is_mandatory"];
	    }
	}
	export class CheckResult {
	    has_update: boolean;
	    is_prerelease: boolean;
	    current_version: string;
	    update_info?: UpdateInfo;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new CheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.has_update = source["has_update"];
	        this.is_prerelease = source["is_prerelease"];
	        this.current_version = source["current_version"];
	        this.update_info = this.convertValues(source["update_info"], UpdateInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateConfig {
	    Enabled: boolean;
	    ServerURL: string;
	    AutoCheck: boolean;
	    TimeoutMs: number;
	    Channel: string;
	    IgnorePrerelease: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UpdateConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Enabled = source["Enabled"];
	        this.ServerURL = source["ServerURL"];
	        this.AutoCheck = source["AutoCheck"];
	        this.TimeoutMs = source["TimeoutMs"];
	        this.Channel = source["Channel"];
	        this.IgnorePrerelease = source["IgnorePrerelease"];
	    }
	}
	export class MetricsStorage {
	    Enabled: boolean;
	    DBPath: string;
	
	    static createFrom(source: any = {}) {
	        return new MetricsStorage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Enabled = source["Enabled"];
	        this.DBPath = source["DBPath"];
	    }
	}
	export class WhitelistEntry {
	    IP: string;
	
	    static createFrom(source: any = {}) {
	        return new WhitelistEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.IP = source["IP"];
	    }
	}
	export class Upstream {
	    URL: string;
	    Weight: number;
	
	    static createFrom(source: any = {}) {
	        return new Upstream(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.URL = source["URL"];
	        this.Weight = source["Weight"];
	    }
	}
	export class Route {
	    ID: string;
	    Host: string;
	    Path: string;
	    ProxyPassPath: string;
	    SetHeaders: Record<string, string>;
	    StaticDir: string;
	    ExcludeBasicAuth: boolean;
	    BasicAuthEnable?: boolean;
	    BasicAuthUsername: string;
	    BasicAuthPassword: string;
	    BasicAuthForwardHeader?: boolean;
	    Upstreams: Upstream[];
	
	    static createFrom(source: any = {}) {
	        return new Route(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Host = source["Host"];
	        this.Path = source["Path"];
	        this.ProxyPassPath = source["ProxyPassPath"];
	        this.SetHeaders = source["SetHeaders"];
	        this.StaticDir = source["StaticDir"];
	        this.ExcludeBasicAuth = source["ExcludeBasicAuth"];
	        this.BasicAuthEnable = source["BasicAuthEnable"];
	        this.BasicAuthUsername = source["BasicAuthUsername"];
	        this.BasicAuthPassword = source["BasicAuthPassword"];
	        this.BasicAuthForwardHeader = source["BasicAuthForwardHeader"];
	        this.Upstreams = this.convertValues(source["Upstreams"], Upstream);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListenRule {
	    ID: string;
	    ListenAddr: string;
	    SSLEnable: boolean;
	    CertFile: string;
	    KeyFile: string;
	    BasicAuthEnable: boolean;
	    BasicAuthUsername: string;
	    BasicAuthPassword: string;
	    BasicAuthForwardHeader: boolean;
	    Routes: Route[];
	
	    static createFrom(source: any = {}) {
	        return new ListenRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.ListenAddr = source["ListenAddr"];
	        this.SSLEnable = source["SSLEnable"];
	        this.CertFile = source["CertFile"];
	        this.KeyFile = source["KeyFile"];
	        this.BasicAuthEnable = source["BasicAuthEnable"];
	        this.BasicAuthUsername = source["BasicAuthUsername"];
	        this.BasicAuthPassword = source["BasicAuthPassword"];
	        this.BasicAuthForwardHeader = source["BasicAuthForwardHeader"];
	        this.Routes = this.convertValues(source["Routes"], Route);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Config {
	    Rules: ListenRule[];
	    AllowAllLAN: boolean;
	    Whitelist: WhitelistEntry[];
	    MetricsStorage?: MetricsStorage;
	    Update?: UpdateConfig;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Rules = this.convertValues(source["Rules"], ListenRule);
	        this.AllowAllLAN = source["AllowAllLAN"];
	        this.Whitelist = this.convertValues(source["Whitelist"], WhitelistEntry);
	        this.MetricsStorage = this.convertValues(source["MetricsStorage"], MetricsStorage);
	        this.Update = this.convertValues(source["Update"], UpdateConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class KV {
	    key: string;
	    value: number;
	
	    static createFrom(source: any = {}) {
	        return new KV(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	
	export class MetricsDBStatus {
	    enabled: boolean;
	    initialized: boolean;
	    path: string;
	    error?: string;
	    fileExists: boolean;
	    dirExists: boolean;
	    dirWritable: boolean;
	    message?: string;
	
	    static createFrom(source: any = {}) {
	        return new MetricsDBStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.initialized = source["initialized"];
	        this.path = source["path"];
	        this.error = source["error"];
	        this.fileExists = source["fileExists"];
	        this.dirExists = source["dirExists"];
	        this.dirWritable = source["dirWritable"];
	        this.message = source["message"];
	    }
	}
	export class MetricsSeries {
	    timestamps: number[];
	    counts: number[];
	    s2xx: number[];
	    s3xx: number[];
	    s4xx: number[];
	    s5xx: number[];
	    s0: number[];
	    avgLatencyMs: number[];
	    maxLatencyMs: number[];
	    p95: number[];
	    p99: number[];
	    upstreamDist: KV[];
	    topRouteErr: KV[];
	    topUpErr: KV[];
	    latencyDist: KV[];
	
	    static createFrom(source: any = {}) {
	        return new MetricsSeries(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamps = source["timestamps"];
	        this.counts = source["counts"];
	        this.s2xx = source["s2xx"];
	        this.s3xx = source["s3xx"];
	        this.s4xx = source["s4xx"];
	        this.s5xx = source["s5xx"];
	        this.s0 = source["s0"];
	        this.avgLatencyMs = source["avgLatencyMs"];
	        this.maxLatencyMs = source["maxLatencyMs"];
	        this.p95 = source["p95"];
	        this.p99 = source["p99"];
	        this.upstreamDist = this.convertValues(source["upstreamDist"], KV);
	        this.topRouteErr = this.convertValues(source["topRouteErr"], KV);
	        this.topUpErr = this.convertValues(source["topUpErr"], KV);
	        this.latencyDist = this.convertValues(source["latencyDist"], KV);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MetricsPayload {
	    windowSeconds: number;
	    listenAddrs: string[];
	    byListenAddr: Record<string, MetricsSeries>;
	    minuteWindowSeconds: number;
	    byListenMinute: Record<string, MetricsSeries>;
	
	    static createFrom(source: any = {}) {
	        return new MetricsPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.windowSeconds = source["windowSeconds"];
	        this.listenAddrs = source["listenAddrs"];
	        this.byListenAddr = this.convertValues(source["byListenAddr"], MetricsSeries, true);
	        this.minuteWindowSeconds = source["minuteWindowSeconds"];
	        this.byListenMinute = this.convertValues(source["byListenMinute"], MetricsSeries, true);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class QueryMetricsRequest {
	    startTime: number;
	    endTime: number;
	    listenAddr: string;
	    useMinute: boolean;
	
	    static createFrom(source: any = {}) {
	        return new QueryMetricsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.startTime = source["startTime"];
	        this.endTime = source["endTime"];
	        this.listenAddr = source["listenAddr"];
	        this.useMinute = source["useMinute"];
	    }
	}
	export class QueryMetricsResponse {
	    series: MetricsSeries;
	
	    static createFrom(source: any = {}) {
	        return new QueryMetricsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.series = this.convertValues(source["series"], MetricsSeries);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QueryRequestLogsRequest {
	    startTime: number;
	    endTime: number;
	    listenAddr: string;
	    upstream: string;
	    requestPath: string;
	    clientIP: string;
	    statusCode: number;
	    page: number;
	    pageSize: number;
	
	    static createFrom(source: any = {}) {
	        return new QueryRequestLogsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.startTime = source["startTime"];
	        this.endTime = source["endTime"];
	        this.listenAddr = source["listenAddr"];
	        this.upstream = source["upstream"];
	        this.requestPath = source["requestPath"];
	        this.clientIP = source["clientIP"];
	        this.statusCode = source["statusCode"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	    }
	}
	export class RequestLog {
	    id: number;
	    timestamp: number;
	    listenAddr: string;
	    clientIP: string;
	    method: string;
	    requestURL: string;
	    requestPath: string;
	    requestHost: string;
	    statusCode: number;
	    upstream: string;
	    routeKey: string;
	    latencyMs: number;
	    userAgent: string;
	    referer: string;
	
	    static createFrom(source: any = {}) {
	        return new RequestLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.listenAddr = source["listenAddr"];
	        this.clientIP = source["clientIP"];
	        this.method = source["method"];
	        this.requestURL = source["requestURL"];
	        this.requestPath = source["requestPath"];
	        this.requestHost = source["requestHost"];
	        this.statusCode = source["statusCode"];
	        this.upstream = source["upstream"];
	        this.routeKey = source["routeKey"];
	        this.latencyMs = source["latencyMs"];
	        this.userAgent = source["userAgent"];
	        this.referer = source["referer"];
	    }
	}
	export class QueryRequestLogsResponse {
	    logs: RequestLog[];
	    total: number;
	    page: number;
	    pageSize: number;
	    totalPage: number;
	
	    static createFrom(source: any = {}) {
	        return new QueryRequestLogsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.logs = this.convertValues(source["logs"], RequestLog);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.totalPage = source["totalPage"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	

}

