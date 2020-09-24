class PageInfo{
    private _pageNum: number = 1;
    public get pageNum(): number {
        return this._pageNum;
    }
    public set pageNum(value: number) {
        this._pageNum = value ? value : 1;
    }

    private _pages: number = 0;
    public get pages(): number {
        return this._pages;
    }
    public set pages(value: number) {
        this._pages = value ? value : 0;
    }

    private _total: number = 0;
    public get total(): number {
        return this._total;
    }
    public set total(value: number) {
        this._total = value ? value : 0;
    }

    private _pageSize: number = 0;
    public get pageSize(): number {
        return this._pageSize;
    }
    public set pageSize(value: number) {
        this._pageSize = value ? value : 0;
    }

    private _prePage: number = 0;
    public get prePage(): number {
        return this._prePage;
    }
    public set prePage(value: number) {
        this._prePage = value ? value : 0;
    }

    private _nextPage: number = 0;
    public get nextPage(): number {
        return this._nextPage;
    }
    public set nextPage(value: number) {
        this._nextPage = value ? value : 0;
    }

    private _firstPage: boolean = false;
    public get firstPage(): boolean {
        return this._firstPage;
    }
    public set firstPage(value: boolean) {
        this._firstPage = value ? value : false;
    }

    private _lastPage: boolean = false;
    public get lastPage(): boolean {
        return this._lastPage;
    }
    public set lastPage(value: boolean) {
        this._lastPage = value ? value : false;
    }

    private _hasPreviousPage: boolean = false;
    public get hasPreviousPage(): boolean {
        return this._hasPreviousPage;
    }
    public set hasPreviousPage(value: boolean) {
        this._hasPreviousPage = value ? value : false;
    }

    private _hasNextPage: boolean = false;
    public get hasNextPage(): boolean {
        return this._hasNextPage;
    }
    public set hasNextPage(value: boolean) {
        this._hasNextPage = value ? value : false;
    }

    constructor(result: any){
        this.pageNum = result.pageNum;
        this.pages = result.pages;
        this.total = result.total;
        this.pageSize = result.pageSize;
        this.prePage = result.prePage;
        this.nextPage = result.nextPage;
        this.firstPage = result.firstPage;
        this.lastPage = result.lastPage;
        this.hasPreviousPage = result.hasPreviousPage;
        this.hasNextPage = result.hasNextPage;
    }
}

export default PageInfo;