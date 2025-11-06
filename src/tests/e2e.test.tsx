import { assert, clock, test } from "@marcisbee/rion/test";
import { mount } from "../../test/utils.ts";
import { createKey, suspend, Suspense, unsuspend, update } from "../client.ts";

test("suspense + key", async () => {
  function Child(this: HTMLElement, props: JSX.Props<{ value: string }>) {
    let data = 42;

    suspend(this);

    new Promise((resolve) => setTimeout(resolve, 200))
      .then(() => {
        data = 100;
        update(this);
        unsuspend(this);
      });

    return () => <div>{data} : {props().value}</div>;
  }

  let value = "";
  function Parent() {
    return (
      <main>
        <Suspense fallback={() => <strong>Loading..</strong>}>
          <section>
            {() => value && createKey(() => <Child value={value} />, value)}
          </section>
        </Suspense>
      </main>
    );
  }

  const root = await mount(<Parent />, document.body);

  assert.snapshot.html(
    root,
    `
    <host>
      <main>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$-->
            <section>
              <!--$-->
            </section>
          </suspense>
          <!--$--><!--null-->
        </host>
      </main>
    </host>
    `,
  );

  value = "first";
  update(root);

  assert.snapshot.html(
    root,
    `
    <host>
      <main>
        <host>
          <suspense _r="" style="display: none;">
            <!--$-->
            <section>
              <!--$-->
              <host><!--$--><div>42 : first</div></host>
            </section>
          </suspense>
          <!--$--><strong>Loading..</strong>
        </host>
      </main>
    </host>
    `,
  );

  await clock.fastForward(200);
  await Promise.resolve();

  assert.snapshot.html(
    root,
    `
    <host>
      <main>
        <host>
          <suspense _r="" style="display: contents;">
            <!--$-->
            <section>
              <!--$-->
              <host><!--$--><div>100 : first</div></host>
            </section>
          </suspense>
          <!--$--><!--null-->
        </host>
      </main>
    </host>
    `,
  );
});

await test.run();
