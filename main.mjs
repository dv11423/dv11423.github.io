import {siteurl,local,signal,createApp,ref} from '/env.mjs'

new class{
	site="cr"
	menu=ref(null)
	main=ref(null)
	userId=ref(null)
	free=new Map([
		["menu",a=>{}],
		["main",a=>{}]
	])
	methods={

	}
	constructor(){
		local.app=this
		createApp({
			methods:this.methods,
			setup:e=>this.setup(),
			mounted:e=>this.mounted()
		}).mount(".app")
	}
	setup(){
		return{
			menu:this.menu,
			main:this.main
			,test:ref("test")
		}
	}
	async mounted(){
		var {code,id}=await this.xget("/signon")
		if(code==200){
			this.userId=id
			this.load(this.menu.value,"menu","menu","/page/menu.htm")
			this.load(this.main.value,"main","home","/page/home.htm")
		}else{
			this.userId=""
			this.unload("menu")
			this.load(this.main.value,"main","signin","/page/signin.htm")
		}
	}
	loadMain(id){
		return this.load(this.main.value,"main",id,"/page/"+id+".htm")
	}
	load(ref,target,name,url){
		var task=new Promise((resolve,reject)=>{
			var x=new XMLHttpRequest()
			x.responseType="document"
			x.open("GET",url,true)
			x.onload=e=>resolve(x.response)
			x.onerror=reject
			x.send()
		})
		return new Promise(async(resolve,reject)=>{
			var body=await task
			var ste=body.querySelector("style")
			var src=document.createElement("script")

			signal.set(name,e=>{
				var el=body.querySelector("div")
				var app=createApp(e)
				var proc=this.free.get(target)
				var vm=app.mount(el)

				ref.appendChild(el)

				if(proc)proc()
				this.free.set(target,e=>{
					ref.removeChild(el)
					ref.removeChild(ste)
					ref.removeChild(src)

					app.unmount(el)

					this.free.delete(target)
				})
				signal.delete(name)
				resolve(vm)
			})
			ref.appendChild(ste)
			src.type="module"
			src.text=body.querySelector("script").text
			ref.appendChild(src)
		})
	}
	unload(target){
		var proc=this.free.get(target)
		if(proc)proc()
	}
	async get(url){
		var res=await fetch(url)
		var text=await res.text()
		try{
			return JSON.parse(text)
		}catch(e){}
		return text
	}
	async xget(url){
		var res=await fetch(siteurl+url,{
			credentials:"include"
		})
		var text=await res.text()
		try{
			return JSON.parse(text)
		}catch(e){}
		return text
	}
	async xpost(url,obj){
		var res=await fetch(siteurl+url,{
			credentials:"include",
			method:"POST",
			body:JSON.stringify({
				site:this.site,
				...obj
			})
		})
		var text=await res.text()
		try{
			return JSON.parse(text)
		}catch(e){}
		return text
	}
	runScript(node,script){
		var src=document.createElement("script")
		src.type="module"
		src.text=script.text
		node.appendChild(src)
		script.remove()
	}
}