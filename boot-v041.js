(async()=>{
  const fail=(error)=>{
    console.error(error);
    document.body.innerHTML='<div class="load"><b>실행 오류</b><p>'+String(error&&error.message||error)+'</p><p class="sub">페이지를 새로고침하거나 단일 HTML 빌드를 이용해 주세요.</p></div>';
  };
  const bytesFromBase64=(text)=>Uint8Array.from(atob(text.replace(/\s+/g,'')),c=>c.charCodeAt(0));
  const decode=(bytes)=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const applyUnifiedPatch=(source,patchText)=>{
    const sourceLines=source.split('\n');
    const patchLines=patchText.split('\n');
    const output=[];
    let sourceIndex=0;
    let i=0;
    while(i<patchLines.length && !patchLines[i].startsWith('@@ ')) i++;
    while(i<patchLines.length){
      const header=patchLines[i];
      if(!header.startsWith('@@ ')){i++;continue;}
      const match=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
      if(!match) throw new Error('업데이트 패치 형식을 읽을 수 없습니다');
      const oldStart=Number(match[1])-1;
      while(sourceIndex<oldStart) output.push(sourceLines[sourceIndex++]);
      i++;
      while(i<patchLines.length && !patchLines[i].startsWith('@@ ')){
        const line=patchLines[i];
        if(line.startsWith('--- ')||line.startsWith('+++ ')){i++;continue;}
        const tag=line[0];
        const text=line.slice(1);
        if(tag===' '){
          if(sourceLines[sourceIndex]!==text) throw new Error('업데이트 문맥 검증 실패');
          output.push(sourceLines[sourceIndex++]);
        }else if(tag==='-'){
          if(sourceLines[sourceIndex]!==text) throw new Error('업데이트 삭제 검증 실패');
          sourceIndex++;
        }else if(tag==='+'){
          output.push(text);
        }else if(tag==='\\'){
          // "No newline at end of file" marker
        }else if(line===''){
          // diff 파일의 마지막 빈 줄
        }else{
          throw new Error('알 수 없는 업데이트 명령');
        }
        i++;
      }
    }
    while(sourceIndex<sourceLines.length) output.push(sourceLines[sourceIndex++]);
    return output.join('\n');
  };

  try{
    const encoded=(window.__BTQ||[]).join('');
    delete window.__BTQ;
    if(!encoded) throw new Error('기본 게임 데이터가 비어 있습니다');
    if(!window.pako||typeof window.pako.ungzip!=='function') throw new Error('호환 압축 해제기를 불러오지 못했습니다');
    const oldHtml=decode(window.pako.ungzip(bytesFromBase64(encoded)));
    const patchUrls=["patches/v041f.0.b64?v=0412", "patches/v041f.1.b64?v=0412", "patches/v041f.2.b64?v=0412", "patches/v041f.3.b64?v=0412", "patches/v041fix2.00.b64?v=0412", "patches/v041fix2.01.b64?v=0412", "patches/v041fix2.02.b64?v=0412", "patches/v041fix2.03.b64?v=0412", "patches/v041fix2.04.b64?v=0412", "patches/v041fix2.05.b64?v=0412", "patches/v041fix2.06.b64?v=0412", "patches/v041fix2.07.b64?v=0412", "patches/v041fix2.08.b64?v=0412", "patches/v041fix2.09.b64?v=0412", "patches/v041fix2.10.b64?v=0412", "patches/v041fix2.11.b64?v=0412", "patches/v041f.6.b64?v=0412"];
    const responses=await Promise.all(patchUrls.map((url)=>fetch(url,{cache:'no-store'})));
    if(responses.some((response)=>!response.ok)) throw new Error('v0.4.1 업데이트 파일을 불러오지 못했습니다');
    const patchBase64=(await Promise.all(responses.map((response)=>response.text()))).join('');
    const patchText=decode(bytesFromBase64(patchBase64));
    const html=applyUnifiedPatch(oldHtml,patchText);
    if(!html.includes('v0.4.1')||!html.includes('id="game"')) throw new Error('게임 데이터 최종 검증 실패');
    document.open();
    document.write(html);
    document.close();
  }catch(error){
    fail(error);
  }
})();
