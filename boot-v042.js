(async()=>{
  const fail=(error)=>{
    console.error(error);
    document.body.innerHTML='<main class="load"><b>실행 오류</b><p>'+String(error&&error.message||error)+'</p><p class="sub">표시된 오류 문구를 그대로 알려주세요. 단일 HTML 다운로드판은 별도로 실행됩니다.</p></main>';
  };
  const decodeBase64=(text)=>Uint8Array.from(atob(text.replace(/\s+/g,'')),c=>c.charCodeAt(0));
  const decodeUtf8=(bytes)=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const applyPatch=(source,patchText)=>{
    const sourceLines=source.split('\n'),patchLines=patchText.split('\n'),out=[];
    let si=0,i=0;
    while(i<patchLines.length&&!patchLines[i].startsWith('@@ '))i++;
    while(i<patchLines.length){
      const m=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patchLines[i]);
      if(!m){i++;continue;}
      const oldStart=Number(m[1])-1;
      while(si<oldStart)out.push(sourceLines[si++]);
      i++;
      while(i<patchLines.length&&!patchLines[i].startsWith('@@ ')){
        const line=patchLines[i],tag=line[0],text=line.slice(1);
        if(line.startsWith('--- ')||line.startsWith('+++ ')){i++;continue;}
        if(tag===' '){if(sourceLines[si]!==text)throw new Error('업데이트 문맥 검증 실패');out.push(sourceLines[si++]);}
        else if(tag==='-'){if(sourceLines[si]!==text)throw new Error('업데이트 삭제 검증 실패');si++;}
        else if(tag==='+')out.push(text);
        else if(tag==='\\'||line===''){}
        else throw new Error('알 수 없는 업데이트 명령');
        i++;
      }
    }
    while(si<sourceLines.length)out.push(sourceLines[si++]);
    return out.join('\n');
  };
  try{
    const encoded=(window.__BTQ||[]).join('');delete window.__BTQ;
    if(!encoded)throw new Error('기본 게임 데이터가 비어 있습니다');
    if(typeof DecompressionStream!=='function')throw new Error('이 브라우저에는 gzip 압축 해제 기능이 없습니다');
    const stream=new Blob([decodeBase64(encoded)]).stream().pipeThrough(new DecompressionStream('gzip'));
    const oldHtml=await new Response(stream).text();
    const urls=["patches/v041f.0.b64?v=042", "patches/v041f.1.b64?v=042", "patches/v041f.2.b64?v=042", "patches/v041f.3.b64?v=042", "patches/v041fix2.00.b64?v=042", "patches/v041fix2.01.b64?v=042", "patches/v041fix2.02.b64?v=042", "patches/v041fix2.03.b64?v=042", "patches/v041fix2.04.b64?v=042", "patches/v041fix2.05.b64?v=042", "patches/v041fix2.06.b64?v=042", "patches/v041fix2.07.b64?v=042", "patches/v041fix2.08.b64?v=042", "patches/v041fix2.09.b64?v=042", "patches/v041fix2.10.b64?v=042", "patches/v041fix2.11.b64?v=042", "patches/v041f.6.b64?v=042"];
    const responses=await Promise.all(urls.map(url=>fetch(url,{cache:'no-store'})));
    const failed=responses.findIndex(response=>!response.ok);
    if(failed>=0)throw new Error('업데이트 파일을 불러오지 못했습니다: '+urls[failed]);
    const patchText=decodeUtf8(decodeBase64((await Promise.all(responses.map(r=>r.text()))).join('')));
    let html=applyPatch(oldHtml,patchText);
    const oldMoon="      // 월영참은 \"여러 개의 부드러운 소회전이 같은 방향으로 이어진 호\"만 인정한다.\n      // 뚜렷한 모서리, 좌우 흔들림, 한두 번의 꺾임은 연쇄참으로 남는다.\n      const moonShape = !closedCandidate && !ninjutsuActive &&\n        total >= 165 &&\n        straightness >= 0.32 && straightness <= 0.925 &&\n        maximumLineDeviation >= Math.max(62, total * 0.115) &&\n        arcProfile.amplitudeRatio >= 0.125 &&\n        arcProfile.sideRatio >= 0.86 &&\n        arcProfile.profileScore >= 0.72 &&\n        arcProfile.peakPosition >= 0.16 && arcProfile.peakPosition <= 0.84 &&\n        gesture.absoluteTurn >= 0.86 && gesture.absoluteTurn <= 4.10 &&\n        gesture.consistency >= 0.72 &&\n        gesture.signChanges <= 2 &&\n        skeletonCorners.hardCorners === 0 &&\n        skeletonCorners.maximum <= 0.70;\n";
    if(!html.includes(oldMoon))throw new Error('월영참 판정 원본을 찾지 못했습니다');
    html=html.replace(oldMoon,"      // v0.4.2 월영참: 점별 회전량보다 '한쪽으로 부드럽게 부푼 C/U형 윤곽'을 우선 본다.\n      // 빠르게 그린 완만한 곡선은 점마다 회전각이 작아도 월영참이 되어야 한다.\n      // 반대로 좌우가 번갈아 바뀌는 지그재그와 날카로운 V/X는 연쇄참·인술로 남긴다.\n      const moonShape = !closedCandidate && !ninjutsuActive &&\n        total >= 135 &&\n        straightness >= 0.20 && straightness <= 0.985 &&\n        maximumLineDeviation >= Math.max(36, total * 0.060) &&\n        arcProfile.amplitude >= Math.max(34, direct * 0.060) &&\n        arcProfile.amplitudeRatio >= 0.072 &&\n        arcProfile.sideRatio >= 0.76 &&\n        arcProfile.profileScore >= 0.64 &&\n        arcProfile.peakPosition >= 0.10 && arcProfile.peakPosition <= 0.90 &&\n        gesture.signChanges <= 3 &&\n        skeletonCorners.hardCorners <= 1 &&\n        skeletonCorners.majorCorners <= 3 &&\n        skeletonCorners.maximum <= 0.95;\n")
      .replaceAll('v0.4.1','v0.4.2')
      .replace("shapeReason = '한 방향의 부드러운 곡률';","shapeReason = '한쪽으로 이어진 C/U형 곡선';");
    if(!html.includes('v0.4.2')||!html.includes('id="game"')||!html.includes('arcProfile.amplitudeRatio >= 0.072'))throw new Error('v0.4.2 게임 데이터 검증 실패');
    document.open();document.write(html);document.close();
  }catch(error){fail(error);}
})();
