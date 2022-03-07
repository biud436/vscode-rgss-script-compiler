/**
 * @class Mutex<T>
 * @description
 * Node.js는 싱글 쓰레드이지만, 백그라운드 단에 ThreadPool이 존재한다.
 * libuv는 Network, File 처리 등을 ThreadJob을 통해 분배하여 적당히 job을 처리하고 콜스택으로 내보냅니다.
 *
 * 메모리는 스택, 힙, 또한 스택의 위치를 나타내는 스택 프레임이 있으며 스택 프레임은 스택의 위치를 저장하는 데 사용됩니다.
 * libuv로 이벤트 기반의 프로그래밍을 하므로 유연한 프로그래밍이 가능하지만,
 *
 * 이벤트 기반의 프로그래밍에서도 쓰레드의 동시성 문제와 비슷한 문제가 생길 수 있습니다.
 * 예를 들면, 동시에 여러 Promise 또는 비동기 함수에서 특정 변수 값을 수정하는 경우, 동시성 문제가 역시 일어날 수 있습니다.
 * 쓰레드 프로그래밍에서 자주 사용되는 Mutex Lock을 사용하여 동시성 문제를 해결할 수 있습니다.
 *
 * @link https://spin.atomicobject.com/2018/09/10/javascript-concurrency/
 */
export class Mutex<T> {
  private mutex = Promise.resolve();

  lock(): PromiseLike<() => void> {
    let begin: (unlock: () => void) => void = (unlock) => {};

    this.mutex = this.mutex.then(() => {
      return new Promise(begin);
    });

    return new Promise((res) => {
      begin = res;
    });
  }

  async dispatch(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();

    try {
      return await Promise.resolve(fn());
    } finally {
      unlock();
    }
  }
}
